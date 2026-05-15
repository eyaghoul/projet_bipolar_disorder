from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone, timedelta, date
from bson import ObjectId

from app.models.mood_log import MoodLogCreate, MoodLogOut
from app.services.auth_service import get_current_user, require_role
from app.services.alert_service import evaluate_alerts
from app.db import database as db

router = APIRouter(prefix="/mood-log", tags=["Mood Log"])


@router.post("", response_model=MoodLogOut, status_code=201)
async def create_mood_log(
    body: MoodLogCreate,
    current_user: dict = Depends(require_role("patient")),
):
    patient = await db.patients().find_one({"userId": current_user["id"]})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    patient_id = str(patient["_id"])
    now = datetime.now(timezone.utc)

    doc = {
        "patientId": patient_id,
        "date": body.date.isoformat(),
        "mood": body.mood,
        "sleep": body.sleep,
        "energy": body.energy,
        "irritability": body.irritability,
        "notes": body.notes,
        "createdAt": now,
    }
    result = await db.mood_logs().insert_one(doc)

    # Evaluate risk patterns after each new log
    await evaluate_alerts(patient_id)

    return {
        "id": str(result.inserted_id),
        "patientId": patient_id,
        "date": body.date,
        "mood": body.mood,
        "sleep": body.sleep,
        "energy": body.energy,
        "irritability": body.irritability,
        "notes": body.notes,
        "createdAt": now,
    }


@router.get("/{patient_id}")
async def get_mood_logs(
    patient_id: str,
    current_user: dict = Depends(get_current_user),
):
    # Patients can only fetch their own logs
    if current_user["role"] == "patient":
        patient = await db.patients().find_one({"userId": current_user["id"]})
        if not patient:
            raise HTTPException(status_code=403, detail="Access denied")
        patient_str_id = str(patient["_id"])
        if patient_str_id != patient_id and current_user["id"] != patient_id:
            raise HTTPException(status_code=403, detail="Access denied")
        patient_id = patient_str_id  # Normalize
        # Free: 7 days, Premium: 90 days
        days = 90 if current_user["plan"] == "premium" else 7
    else:
        days = 90  # Professionals and admins always get full history

    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).date().isoformat()
    cursor = db.mood_logs().find(
        {"patientId": patient_id, "date": {"$gte": cutoff}},
        sort=[("date", 1)],
    )
    docs = await cursor.to_list(length=days + 5)
    return [
        {
            "id": str(d["_id"]),
            "patientId": d["patientId"],
            "date": d["date"],
            "mood": d["mood"],
            "sleep": d["sleep"],
            "energy": d["energy"],
            "irritability": d["irritability"],
            "notes": d.get("notes"),
            "createdAt": d["createdAt"],
        }
        for d in docs
    ]
