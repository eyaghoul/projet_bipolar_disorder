from fastapi import APIRouter, HTTPException, Request, status
from datetime import datetime, timezone
from bson import ObjectId

from app.models.user import UserCreate, UserLogin, TokenResponse, UpgradePremiumRequest
from app.services.auth_service import hash_password, verify_password, create_access_token, get_current_user
from app.db import database as db
from fastapi import Depends

router = APIRouter(prefix="/auth", tags=["Auth"])


def _fmt_user(u: dict) -> dict:
    return {
        "id": str(u["_id"]),
        "name": u["name"],
        "email": u["email"],
        "role": u["role"],
        "plan": u["plan"],
        "status": u["status"],
        "createdAt": u["createdAt"],
        "office_location": u.get("office_location"),
    }


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    user = await db.users().find_one({"_id": ObjectId(current_user["id"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _fmt_user(user)


@router.put("/profile")
async def update_profile(
    body: dict,
    current_user: dict = Depends(get_current_user)
):
    """Allow user to update name and office_location."""
    update_data = {}
    if "name" in body:
        update_data["name"] = body["name"]
    if "office_location" in body:
        loc = body["office_location"]
        if isinstance(loc, dict):
            if "city" in loc and loc["city"]:
                loc["city"] = loc["city"].strip()
            if "latitude" in loc and loc["latitude"] is not None:
                try: loc["latitude"] = float(loc["latitude"])
                except: pass
            if "longitude" in loc and loc["longitude"] is not None:
                try: loc["longitude"] = float(loc["longitude"])
                except: pass
        update_data["office_location"] = loc

    if not update_data:
        raise HTTPException(status_code=400, detail="Nothing to update")

    await db.users().update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": update_data}
    )
    
    updated = await db.users().find_one({"_id": ObjectId(current_user["id"])})
    return _fmt_user(updated)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(body: UserCreate):
    if await db.users().find_one({"email": body.email}):
        raise HTTPException(status_code=409, detail="Email already registered")

    now = datetime.now(timezone.utc)
    user_doc = {
        "name": body.name,
        "email": body.email,
        "passwordHash": hash_password(body.password),  # PII: only hash stored
        "role": body.role,
        "plan": "free",
        "status": "active",
        "createdAt": now,
    }
    result = await db.users().insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    # Create patient profile if role=patient
    if body.role == "patient":
        await db.patients().insert_one({
            "userId": str(result.inserted_id),
            "assignedProfessionalId": None,
            "demographics": {},
            "createdAt": now,
        })

    token = create_access_token(str(result.inserted_id), body.email, body.role, "free")
    await _audit(str(result.inserted_id), body.email, "register", "users", str(result.inserted_id))
    return {"access_token": token, "token_type": "bearer", "user": _fmt_user(user_doc)}


@router.post("/login", response_model=TokenResponse)
async def login(body: UserLogin):
    user = await db.users().find_one({"email": body.email})
    if not user or not verify_password(body.password, user["passwordHash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if user.get("status") == "suspended":
        raise HTTPException(status_code=403, detail="Account suspended")

    token = create_access_token(str(user["_id"]), user["email"], user["role"], user["plan"])
    await _audit(str(user["_id"]), user["email"], "login", "users", str(user["_id"]))
    return {"access_token": token, "token_type": "bearer", "user": _fmt_user(user)}


@router.post("/upgrade-to-premium", response_model=TokenResponse)
async def upgrade_to_premium(
    body: UpgradePremiumRequest,
    current_user: dict = Depends(get_current_user),
):
    if current_user["plan"] == "premium":
        raise HTTPException(status_code=400, detail="Already on premium plan")

    # Mock payment processing — replace payment_token with Stripe charge in production
    now = datetime.now(timezone.utc)
    await db.payments().insert_one({
        "userId": current_user["id"],
        "amount": 9.99,
        "currency": "USD",
        "status": "succeeded",
        "provider": "mock",
        "createdAt": now,
    })

    await db.users().update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": {"plan": "premium"}},
    )
    token = create_access_token(current_user["id"], current_user["email"], current_user["role"], "premium")
    updated = await db.users().find_one({"_id": ObjectId(current_user["id"])})
    await _audit(current_user["id"], current_user["email"], "upgrade_to_premium", "users", current_user["id"])
    return {"access_token": token, "token_type": "bearer", "user": _fmt_user(updated)}


async def _audit(user_id, email, action, resource, target_id, ip="internal"):
    await db.audit_logs().insert_one({
        "userId": user_id, "userEmail": email, "action": action,
        "targetResource": resource, "targetId": target_id,
        "ip": ip, "timestamp": datetime.now(timezone.utc),
    })
