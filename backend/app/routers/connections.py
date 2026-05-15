from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone
from bson import ObjectId
from typing import List

from app.models.connection import ConnectionCreate, ConnectionUpdate, ConnectionOut
from app.services.auth_service import get_current_user, require_role
from app.db import database as db

router = APIRouter(prefix="/connections", tags=["Connections"])

@router.post("/request", response_model=dict, status_code=status.HTTP_201_CREATED)
async def request_connection(
    body: ConnectionCreate,
    current_user: dict = Depends(require_role("patient")),
):
    # Check if doctor exists
    doctor = await db.users().find_one({"_id": ObjectId(body.doctor_id), "role": "professional"})
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    # Check if already blocked
    if body.doctor_id in current_user.get("blocked_doctors", []):
        raise HTTPException(status_code=403, detail="Doctor is blocked")

    # Check if already connected or pending
    existing = await db.doctor_patient_connections().find_one({
        "patient_id": current_user["id"],
        "doctor_id": body.doctor_id
    })
    if existing:
        if existing["status"] == "approved":
            raise HTTPException(status_code=400, detail="Already connected")
        if existing["status"] == "pending":
            raise HTTPException(status_code=400, detail="Request already pending")

    doc = {
        "patient_id": current_user["id"],
        "doctor_id": body.doctor_id,
        "status": "pending",
        "initiated_by": "patient",
        "requested_at": datetime.now(timezone.utc),
        "message": body.message
    }
    result = await db.doctor_patient_connections().insert_one(doc)
    return {"id": str(result.inserted_id), "status": "pending"}

@router.get("/my-requests", response_model=List[ConnectionOut])
async def get_my_requests(
    current_user: dict = Depends(get_current_user),
):
    query = {}
    if current_user["role"] == "professional":
        query = {"doctor_id": current_user["id"], "status": "pending"}
    else:
        query = {"patient_id": current_user["id"]}

    cursor = db.doctor_patient_connections().find(query, sort=[("requested_at", -1)])
    docs = await cursor.to_list(length=100)
    
    result = []
    for d in docs:
        item = {
            "id": str(d["_id"]),
            **{k: v for k, v in d.items() if k != "_id"}
        }
        # Enrich with names
        patient = await db.users().find_one({"_id": ObjectId(d["patient_id"])})
        doctor = await db.users().find_one({"_id": ObjectId(d["doctor_id"])})
        if patient: item["patient_name"] = patient["name"]
        if doctor: item["doctor_name"] = doctor["name"]
        result.append(item)
    
    return result

@router.put("/{connection_id}/approve", response_model=dict)
async def approve_connection(
    connection_id: str,
    current_user: dict = Depends(require_role("professional")),
):
    conn = await db.doctor_patient_connections().find_one({
        "_id": ObjectId(connection_id),
        "doctor_id": current_user["id"]
    })
    if not conn:
        raise HTTPException(status_code=404, detail="Connection request not found")

    await db.doctor_patient_connections().update_one(
        {"_id": ObjectId(connection_id)},
        {"$set": {"status": "approved", "responded_at": datetime.now(timezone.utc)}}
    )
    
    # Update doctor's patient count
    await db.users().update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$inc": {"current_patients_count": 1}}
    )

    return {"message": "Connection approved"}

@router.put("/{connection_id}/reject", response_model=dict)
async def reject_connection(
    connection_id: str,
    current_user: dict = Depends(require_role("professional")),
):
    conn = await db.doctor_patient_connections().find_one({
        "_id": ObjectId(connection_id),
        "doctor_id": current_user["id"]
    })
    if not conn:
        raise HTTPException(status_code=404, detail="Connection request not found")

    await db.doctor_patient_connections().update_one(
        {"_id": ObjectId(connection_id)},
        {"$set": {"status": "rejected", "responded_at": datetime.now(timezone.utc)}}
    )
    return {"message": "Connection rejected"}

@router.delete("/{connection_id}", response_model=dict)
async def disconnect(
    connection_id: str,
    current_user: dict = Depends(get_current_user),
):
    # Both patient and doctor can disconnect
    query = {"_id": ObjectId(connection_id)}
    if current_user["role"] == "professional":
        query["doctor_id"] = current_user["id"]
    else:
        query["patient_id"] = current_user["id"]

    conn = await db.doctor_patient_connections().find_one(query)
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")

    await db.doctor_patient_connections().delete_one(query)
    
    if conn["status"] == "approved":
        # Decrement doctor's patient count
        await db.users().update_one(
            {"_id": ObjectId(conn["doctor_id"])},
            {"$inc": {"current_patients_count": -1}}
        )

    return {"message": "Disconnected"}

@router.post("/{doctor_id}/block", response_model=dict)
async def block_doctor(
    doctor_id: str,
    current_user: dict = Depends(require_role("patient")),
):
    # Add to blocked list
    await db.users().update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$addToSet": {"blocked_doctors": doctor_id}}
    )
    
    # Remove any existing connection
    await db.doctor_patient_connections().delete_many({
        "patient_id": current_user["id"],
        "doctor_id": doctor_id
    })
    
    return {"message": "Doctor blocked"}
