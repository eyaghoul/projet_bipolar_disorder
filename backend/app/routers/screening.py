from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId

from app.models.questionnaire import QuestionnaireAnswers
from app.models.screening import ScreeningResult, ScreeningHistoryItem
from app.services.auth_service import get_current_user, require_role
from app.services import screening_service
from app.db import database as db
from pydantic import BaseModel

router = APIRouter(prefix="/screening", tags=["Screening"])


class RunScreeningBody(BaseModel):
    answers: QuestionnaireAnswers


@router.post("/run", response_model=ScreeningResult)
async def run_screening(
    body: RunScreeningBody,
    current_user: dict = Depends(require_role("patient")),
):
    patient = await db.patients().find_one({"userId": current_user["id"]})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    features = body.answers.to_feature_dict()
    result = await screening_service.run_screening(
        str(patient["_id"]), features, current_user["plan"]
    )
    return {
        "id": result["id"],
        "patientId": result["patientId"],
        "modelVersion": result["modelVersion"],
        "binary_label": result["binary_label"],
        "confidence": result["confidence"],
        "multiclass_label": result.get("multiclass_label"),
        "multiclass_confidence": result.get("multiclass_confidence"),
        "top_features": result.get("top_features"),
        "plan": result["plan"],
        "createdAt": result["createdAt"],
    }


@router.get("/{patient_id}/history")
async def get_screening_history(
    patient_id: str,
    current_user: dict = Depends(get_current_user),
):
    # Patients can only view their own history; professionals/admins can view any
    if current_user["role"] == "patient":
        patient = await db.patients().find_one({"userId": current_user["id"]})
        if not patient:
            raise HTTPException(status_code=403, detail="Access denied")
        patient_str_id = str(patient["_id"])
        if patient_str_id != patient_id and current_user["id"] != patient_id:
            raise HTTPException(status_code=403, detail="Access denied")
        patient_id = patient_str_id  # Normalize
    
    elif current_user["role"] == "professional":
        p = await db.patients().find_one({"_id": ObjectId(patient_id)})
        if not p:
            raise HTTPException(status_code=404, detail="Patient not found")
        conn = await db.doctor_patient_connections().find_one({
            "doctor_id": current_user["id"],
            "patient_id": p["userId"],
            "status": "approved"
        })
        if not conn:
            raise HTTPException(status_code=403, detail="Not connected to this patient")

    cursor = db.screenings().find({"patientId": patient_id}, sort=[("createdAt", -1)])
    docs = await cursor.to_list(length=50)
    return [
        {
            "id": str(d["_id"]),
            "binary_label": d["binary_label"],
            "confidence": d["confidence"],
            "multiclass_label": d.get("multiclass_label"),
            "multiclass_confidence": d.get("multiclass_confidence"),
            "top_features": d.get("top_features"),
            "plan": d["plan"],
            "createdAt": d["createdAt"],
        }
        for d in docs
    ]
