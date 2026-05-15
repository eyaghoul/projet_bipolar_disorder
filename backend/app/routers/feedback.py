from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from bson import ObjectId

from app.models.feedback import FeedbackCreate, FeedbackOut
from app.services.auth_service import require_role
from app.db import database as db

router = APIRouter(prefix="/feedback", tags=["Feedback"])


@router.post("/{screening_id}", response_model=FeedbackOut, status_code=201)
async def submit_feedback(
    screening_id: str,
    body: FeedbackCreate,
    current_user: dict = Depends(require_role("professional")),
):
    screening = await db.screenings().find_one({"_id": ObjectId(screening_id)})
    if not screening:
        raise HTTPException(status_code=404, detail="Screening not found")

    now = datetime.now(timezone.utc)
    doc = {
        "screeningId": screening_id,
        "professionalId": current_user["id"],
        "correctedLabel": body.correctedLabel,
        "comment": body.comment,
        "createdAt": now,
    }
    result = await db.feedback().insert_one(doc)
    return {
        "id": str(result.inserted_id),
        "screeningId": screening_id,
        "professionalId": current_user["id"],
        "correctedLabel": body.correctedLabel,
        "comment": body.comment,
        "createdAt": now,
    }


@router.get("")
async def list_feedback(current_user: dict = Depends(require_role("professional", "admin"))):
    cursor = db.feedback().find({}, sort=[("createdAt", -1)])
    docs = await cursor.to_list(length=100)
    return [
        {
            "id": str(d["_id"]),
            "screeningId": d["screeningId"],
            "professionalId": d["professionalId"],
            "correctedLabel": d["correctedLabel"],
            "comment": d.get("comment"),
            "createdAt": d["createdAt"],
        }
        for d in docs
    ]
