from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from bson import ObjectId

from app.models.user import UserUpdate
from app.services.auth_service import require_role
from app.db import database as db

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/users")
async def list_users(
    role: str = "",
    plan: str = "",
    status: str = "",
    current_user: dict = Depends(require_role("admin")),
):
    query = {}
    if role:
        query["role"] = role
    if plan:
        query["plan"] = plan
    if status:
        query["status"] = status
    cursor = db.users().find(query, sort=[("createdAt", -1)])
    docs = await cursor.to_list(length=500)
    return [
        {
            "id": str(d["_id"]),
            "name": d["name"],
            "email": d["email"],
            "role": d["role"],
            "plan": d["plan"],
            "status": d["status"],
            "createdAt": d["createdAt"],
        }
        for d in docs
    ]


@router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    body: UserUpdate,
    current_user: dict = Depends(require_role("admin")),
):
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="No fields to update")
    await db.users().update_one({"_id": ObjectId(user_id)}, {"$set": update})
    updated = await db.users().find_one({"_id": ObjectId(user_id)})
    return {"id": str(updated["_id"]), **{k: updated[k] for k in ["name", "email", "role", "plan", "status"]}}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: dict = Depends(require_role("admin")),
):
    await db.users().delete_one({"_id": ObjectId(user_id)})
    return {"message": "User deleted"}


@router.get("/audit-logs")
async def get_audit_logs(
    limit: int = 100,
    current_user: dict = Depends(require_role("admin")),
):
    cursor = db.audit_logs().find({}, sort=[("timestamp", -1)])
    docs = await cursor.to_list(length=limit)
    return [
        {
            "id": str(d["_id"]),
            "userId": d.get("userId"),
            "userEmail": d.get("userEmail"),
            "action": d.get("action"),
            "targetResource": d.get("targetResource"),
            "targetId": d.get("targetId"),
            "ip": d.get("ip"),
            "timestamp": d.get("timestamp"),
        }
        for d in docs
    ]


@router.get("/model-stats")
async def get_model_stats(current_user: dict = Depends(require_role("admin"))):
    total = await db.screenings().count_documents({})
    bipolar = await db.screenings().count_documents({"binary_label": "Bipolar"})
    not_bipolar = await db.screenings().count_documents({"binary_label": "Not Bipolar"})
    type1 = await db.screenings().count_documents({"multiclass_label": "Bipolar Type I"})
    type2 = await db.screenings().count_documents({"multiclass_label": "Bipolar Type II"})
    depressive = await db.screenings().count_documents({"multiclass_label": "Depressive Episode"})
    total_feedback = await db.feedback().count_documents({})
    corrections = await db.feedback().count_documents({"correctedLabel": {"$exists": True}})

    recent_cursor = db.audit_logs().find({}, sort=[("timestamp", -1)])
    recent_logs = await recent_cursor.to_list(length=20)

    return {
        "total_screenings": total,
        "binary_distribution": {"Bipolar": bipolar, "Not Bipolar": not_bipolar},
        "multiclass_distribution": {
            "Bipolar Type I": type1,
            "Bipolar Type II": type2,
            "Depressive Episode": depressive,
        },
        "total_feedback": total_feedback,
        "corrections": corrections,
        "correction_rate": round(corrections / total_feedback, 4) if total_feedback else 0,
        "recent_activity": [
            {"action": d.get("action"), "userEmail": d.get("userEmail"), "timestamp": d.get("timestamp")}
            for d in recent_logs
        ],
    }
