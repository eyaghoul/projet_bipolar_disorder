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
    
    NOTE: Using rule-based scoring because the trained model is broken
    (always predicts 100% Bipolar regardless of input)
    """
    # Calculate average score across all features
    scores = [float(features.get(name, 5.0)) for name in FEATURE_NAMES]
    avg_score = sum(scores) / len(scores)
    
    # Key bipolar indicators (weighted more heavily)
    mood_swing = float(features.get("Mood Swing", 5.0))
    euphoric = float(features.get("Euphoric", 5.0))
    sleep_disorder = float(features.get("Sleep dissorder", 5.0))
    
    # Calculate a weighted risk score (0-10 scale)
    risk_score = (
        avg_score * 0.5 +  # 50% weight on overall symptoms
        mood_swing * 0.2 +  # 20% weight on mood swings
        euphoric * 0.15 +   # 15% weight on euphoria
        sleep_disorder * 0.15  # 15% weight on sleep issues
    )
    
    # Determine classification and confidence
    # Risk score: 0-3 = Not Bipolar, 3-7 = Uncertain, 7-10 = Bipolar
    if risk_score < 3.5:
        label_idx = 0  # Not Bipolar
        # Confidence increases as score gets lower
        confidence_value = 0.55 + (3.5 - risk_score) / 3.5 * 0.40  # 55-95%
    elif risk_score > 6.5:
        label_idx = 1  # Bipolar
        # Confidence increases as score gets higher
        confidence_value = 0.55 + (risk_score - 6.5) / 3.5 * 0.40  # 55-95%
    else:
        # Uncertain zone - lean toward higher scores
        if risk_score >= 5.0:
            label_idx = 1  # Bipolar
            confidence_value = 0.50 + (risk_score - 5.0) / 1.5 * 0.15  # 50-65%
        else:
            label_idx = 0  # Not Bipolar
            confidence_value = 0.50 + (5.0 - risk_score) / 1.5 * 0.15  # 50-65%
    
    # Ensure confidence is in valid range
    confidence_value = max(0.50, min(0.95, confidence_value))
    
    print(f"[PREDICTOR DEBUG] avg_score={avg_score:.2f}, risk_score={risk_score:.2f}, "
          f"label_idx={label_idx}, confidence={confidence_value:.4f}")
    
    return {
        "binary_label": "Bipolar" if label_idx == 1 else "Not Bipolar",
        "confidence": confidence_value,
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
