"""
AI Model Integration Layer
Wraps stage1_MLP.pkl (binary) and stage2_RF.pkl (multiclass) sklearn pipelines.
Drop this file to swap in the real model — the interface stays the same.
"""
import joblib
import numpy as np
import pandas as pd
from typing import Optional

# ── Exact feature names as used during model training ───────────────────────
FEATURE_NAMES = [
    "Sadness", "Euphoric", "Exhausted", "Sleep dissorder",
    "Mood Swing", "Suicidal thoughts", "Anorxia", "Aggressive Response",
    "Nervous Break-down", "Admit Mistakes", "Overthinking",
    "Sexual Activity", "Concentration", "Optimisim",
]

# ── Stage 2 class label mapping (0=Depressive Episode, 1=Bipolar Type I, 2=Bipolar Type II) ─
CLASS2_LABELS = ["Depressive Episode", "Bipolar Type I", "Bipolar Type II"]

# ── Plain-English explanations per feature for the result page ───────────────
FEATURE_EXPLANATIONS = {
    "Sadness":            "persistent feelings of deep sadness",
    "Euphoric":           "episodes of unusual euphoria or elation",
    "Exhausted":          "chronic mental or physical exhaustion",
    "Sleep dissorder":    "significant sleep disturbances",
    "Mood Swing":         "dramatic and frequent mood fluctuations",
    "Suicidal thoughts":  "recurrent thoughts of self-harm or suicide",
    "Anorxia":            "notable changes in appetite",
    "Aggressive Response":"heightened aggressive reactions to situations",
    "Nervous Break-down": "episodes of emotional or nervous breakdown",
    "Admit Mistakes":     "difficulty acknowledging personal errors",
    "Overthinking":       "persistent racing or intrusive thoughts",
    "Sexual Activity":    "changes in sexual interest or activity levels",
    "Concentration":      "difficulty maintaining focus on tasks",
    "Optimisim":          "distorted or unrealistic sense of optimism",
}

_stage1 = None  # MLPClassifier pipeline
_stage2 = None  # OneVsRestClassifier(RF) pipeline


def load_models(stage1_path: str, stage2_path: str) -> None:
    """Load both .pkl models at application startup."""
    global _stage1, _stage2
    _stage1 = joblib.load(stage1_path)
    _stage2 = joblib.load(stage2_path)
    print(f"AI models loaded — Stage1: {type(_stage1.named_steps['model']).__name__}, "
          f"Stage2: {type(_stage2.named_steps['model']).__name__}")


def _build_dataframe(features: dict) -> pd.DataFrame:
    """Convert feature dict → single-row DataFrame with correct column names."""
    row = {name: [float(features.get(name, 5.0))] for name in FEATURE_NAMES}
    return pd.DataFrame(row)


def predict_binary(features: dict) -> dict:
    """
    Stage 1 — Binary classification.
    Returns: { binary_label, confidence }
    Used for both Free and Premium tiers.
    """
    df = _build_dataframe(features)
    label_idx = int(_stage1.predict(df)[0])
    proba = _stage1.predict_proba(df)[0]
    return {
        "binary_label": "Bipolar" if label_idx == 1 else "Not Bipolar",
        "confidence": round(float(proba[label_idx]), 4),
    }


def predict_full(features: dict) -> dict:
    """
    Stage 1 + Stage 2 — Full classification with explanation.
    Returns: { binary_label, confidence, multiclass_label,
               multiclass_confidence, top_features[] }
    Used for Premium tier only (gated in screening_service).
    """
    binary = predict_binary(features)

    df = _build_dataframe(features)
    class_idx = int(_stage2.predict(df)[0])
    proba2 = _stage2.predict_proba(df)[0]
    multiclass_label = CLASS2_LABELS[class_idx]
    multiclass_confidence = round(float(proba2[class_idx]), 4)

    # Extract top-3 contributing features from the RF estimator for predicted class
    ovr = _stage2.named_steps["model"]
    importances = ovr.estimators_[class_idx].feature_importances_
    top_indices = np.argsort(importances)[::-1][:3]

    top_features = []
    for idx in top_indices:
        fname = FEATURE_NAMES[idx]
        user_score = float(features.get(fname, 5.0))
        top_features.append({
            "feature": fname,
            "importance": round(float(importances[idx]), 4),
            "user_score": user_score,
            "explanation": (
                f"Your reported {FEATURE_EXPLANATIONS.get(fname, fname)} "
                f"(score: {user_score:.0f}/10) was a significant factor."
            ),
        })

    return {
        **binary,
        "multiclass_label": multiclass_label,
        "multiclass_confidence": multiclass_confidence,
        "top_features": top_features,
    }
