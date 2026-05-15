from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from bson import ObjectId

from app.models.clinical_note import NoteCreate, NoteOut
from app.services.auth_service import require_role
from app.db import database as db

router = APIRouter(prefix="/clinical-notes", tags=["Clinical Notes"])


@router.post("", response_model=NoteOut, status_code=201)
async def create_note(
    body: NoteCreate,
    current_user: dict = Depends(require_role("professional")),
):
    # Connection check
    p = await db.patients().find_one({"_id": ObjectId(body.patientId)})
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    conn = await db.doctor_patient_connections().find_one({
        "doctor_id": current_user["id"],
        "patient_id": p["userId"],
        "status": "approved"
    })
    if not conn:
        raise HTTPException(status_code=403, detail="Not connected to this patient")

    now = datetime.now(timezone.utc)
    doc = {
        "professionalId": current_user["id"],
        "patientId": body.patientId,
        "content": body.content,
        "sessionDate": body.sessionDate.isoformat(),
        "createdAt": now,
    }
    result = await db.clinical_notes().insert_one(doc)
    return {
        "id": str(result.inserted_id),
        "professionalId": current_user["id"],
        "patientId": body.patientId,
        "content": body.content,
        "sessionDate": body.sessionDate,
        "createdAt": now,
    }


@router.get("/{patient_id}")
async def get_notes(
    patient_id: str,
    current_user: dict = Depends(require_role("professional", "admin")),
):
    # Connection check for professionals
    if current_user["role"] == "professional":
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

    cursor = db.clinical_notes().find(
        {"patientId": patient_id}, sort=[("sessionDate", -1)]
    )
    docs = await cursor.to_list(length=100)
    return [
        {
            "id": str(d["_id"]),
            "professionalId": d["professionalId"],
            "patientId": d["patientId"],
            "content": d["content"],
            "sessionDate": d["sessionDate"],
            "createdAt": d["createdAt"],
        }
        for d in docs
    ]
