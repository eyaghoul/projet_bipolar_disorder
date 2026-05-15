from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from bson import ObjectId

from app.models.questionnaire import QuestionnaireSubmit, QuestionnaireOut
from app.services.auth_service import get_current_user, require_role
from app.db import database as db

router = APIRouter(prefix="/questionnaire", tags=["Questionnaire"])


@router.post("/submit", response_model=QuestionnaireOut)
async def submit_questionnaire(
    body: QuestionnaireSubmit,
    current_user: dict = Depends(require_role("patient")),
):
    patient = await db.patients().find_one({"userId": current_user["id"]})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    answers_dict = body.answers.to_feature_dict()
    doc = {
        "patientId": str(patient["_id"]),
        "answers": answers_dict,
        "submittedAt": datetime.now(timezone.utc),
    }
    result = await db.questionnaires().insert_one(doc)
    return {
        "id": str(result.inserted_id),
        "patientId": str(patient["_id"]),
        "answers": answers_dict,
        "submittedAt": doc["submittedAt"],
    }
