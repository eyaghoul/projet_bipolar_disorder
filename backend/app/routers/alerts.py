from fastapi import APIRouter, Depends
from bson import ObjectId

from app.services.auth_service import get_current_user, require_role
from app.db import database as db

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("")
async def get_alerts(current_user: dict = Depends(get_current_user)):
    query = {"resolved": False}
    if current_user["role"] == "patient":
        patient = await db.patients().find_one({"userId": current_user["id"]})
        if patient:
            query["patientId"] = str(patient["_id"])
    elif current_user["role"] == "professional":
        # Only see alerts for connected patients
        conn_cursor = db.doctor_patient_connections().find({
            "doctor_id": current_user["id"],
            "status": "approved"
        })
        conns = await conn_cursor.to_list(length=500)
        patient_user_ids = [c["patient_id"] for c in conns]
        
        # Get patient IDs (the ones used in alerts)
        patients = await db.patients().find({"userId": {"$in": patient_user_ids}}).to_list(length=500)
        query["patientId"] = {"$in": [str(p["_id"]) for p in patients]}
    # admins see all unresolved alerts
    cursor = db.alerts().find(query, sort=[("triggeredAt", -1)])
    docs = await cursor.to_list(length=100)
    return [
        {
            "id": str(d["_id"]),
            "patientId": d["patientId"],
            "type": d["type"],
            "severity": d["severity"],
            "message": d["message"],
            "triggeredAt": d["triggeredAt"],
            "resolved": d["resolved"],
        }
        for d in docs
    ]


@router.patch("/{alert_id}/resolve")
async def resolve_alert(
    alert_id: str,
    current_user: dict = Depends(require_role("professional", "admin")),
):
    await db.alerts().update_one(
        {"_id": ObjectId(alert_id)}, {"$set": {"resolved": True}}
    )
    return {"message": "Alert resolved"}
