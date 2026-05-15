from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId

from app.services.auth_service import get_current_user, require_role
from app.db import database as db

router = APIRouter(prefix="/patients", tags=["Patients"])


def _fmt(p: dict) -> dict:
    return {
        "id": str(p["_id"]),
        "userId": p.get("userId"),
        "assignedProfessionalId": p.get("assignedProfessionalId"),
        "demographics": p.get("demographics", {}),
        "createdAt": p.get("createdAt"),
    }


@router.get("")
async def list_patients(
    search: str = "",
    current_user: dict = Depends(require_role("professional", "admin")),
):
    query = {}
    
    # If role is professional, only show connected patients
    if current_user["role"] == "professional":
        conn_cursor = db.doctor_patient_connections().find({
            "doctor_id": current_user["id"],
            "status": "approved"
        })
        conns = await conn_cursor.to_list(length=500)
        patient_user_ids = [c["patient_id"] for c in conns]
        query["userId"] = {"$in": patient_user_ids}

    if search:
        # Search by matching user names via lookup
        user_search_query = {"name": {"$regex": search, "$options": "i"}, "role": "patient"}
        if "userId" in query:
             user_search_query["_id"] = {"$in": [ObjectId(uid) for uid in query["userId"]["$in"]]}
             
        matched_users = await db.users().find(user_search_query).to_list(length=100)
        user_ids = [str(u["_id"]) for u in matched_users]
        query["userId"] = {"$in": user_ids}

    # If professional and no patients connected, return empty list
    if current_user["role"] == "professional" and not query.get("userId"):
        return []

    cursor = db.patients().find(query, sort=[("createdAt", -1)])
    patients = await cursor.to_list(length=200)

    # Enrich with user data
    result = []
    for p in patients:
        user = await db.users().find_one({"_id": ObjectId(p["userId"])})
        entry = _fmt(p)
        if user:
            entry["name"] = user["name"]
            entry["email"] = user["email"]
            entry["plan"] = user["plan"]
            entry["status"] = user["status"]
        result.append(entry)
    return result


@router.get("/{patient_id}")
async def get_patient(
    patient_id: str,
    current_user: dict = Depends(require_role("professional", "admin")),
):
    p = await db.patients().find_one({"_id": ObjectId(patient_id)})
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    # Connection check for professionals
    if current_user["role"] == "professional":
        conn = await db.doctor_patient_connections().find_one({
            "doctor_id": current_user["id"],
            "patient_id": p["userId"],
            "status": "approved"
        })
        if not conn:
            raise HTTPException(status_code=403, detail="Not connected to this patient")

    user = await db.users().find_one({"_id": ObjectId(p["userId"])})
    entry = _fmt(p)
    if user:
        entry["name"] = user["name"]
        entry["email"] = user["email"]
        entry["plan"] = user["plan"]
        entry["status"] = user["status"]
    return entry


@router.get("/{patient_id}/mood-logs")
async def get_patient_mood_logs(
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

    cursor = db.mood_logs().find({"patientId": patient_id}, sort=[("date", -1)])
    docs = await cursor.to_list(length=90)
    return [
        {
            "id": str(d["_id"]),
            "date": d["date"],
            "mood": d["mood"],
            "sleep": d["sleep"],
            "energy": d["energy"],
            "irritability": d["irritability"],
            "notes": d.get("notes"),
        }
        for d in docs
    ]
