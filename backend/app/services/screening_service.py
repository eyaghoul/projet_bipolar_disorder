"""
Screening service — calls the AI predictor and persists results.
Free tier: binary result only. Premium tier: full result with multiclass + explanation.
The plan gating lives here, not in the model itself.
"""
from datetime import datetime, timezone
from bson import ObjectId

from ai_model import predictor
from app.db import database as db

MODEL_VERSION = "stage1-MLP_stage2-RF_v1"


async def run_screening(patient_id: str, features: dict, plan: str) -> dict:
    """Run the AI model and persist the screening document."""
    if plan == "premium":
        result = predictor.predict_full(features)
    else:
        result = predictor.predict_binary(features)

    doc = {
        "patientId": patient_id,
        "modelVersion": MODEL_VERSION,
        "binary_label": result["binary_label"],
        "confidence": result["confidence"],
        "multiclass_label": result.get("multiclass_label"),
        "multiclass_confidence": result.get("multiclass_confidence"),
        "top_features": result.get("top_features"),
        "plan": plan,
        "createdAt": datetime.now(timezone.utc),
    }

    inserted = await db.screenings().insert_one(doc)
    doc["id"] = str(inserted.inserted_id)
    doc["patientId"] = patient_id
    return doc
