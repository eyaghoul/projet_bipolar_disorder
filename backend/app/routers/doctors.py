from fastapi import APIRouter, Depends, HTTPException
from typing import List
import math

from app.services.auth_service import get_current_user
from app.services import maps_service
from app.db import database as db
from app.models.user import UserOut

router = APIRouter(prefix="/doctors", tags=["Doctors"])

def haversine(lat1, lon1, lat2, lon2):
    """Calculate the great circle distance between two points on the earth."""
    # Earth radius in kilometers
    R = 6371.0
    
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

@router.get("/nearby")
async def get_nearby_doctors(
    latitude: float,
    longitude: float,
    current_user: dict = Depends(get_current_user)
):
    """Find doctors in the same city as the patient."""
    # 1. Resolve patient's city
    city = await maps_service.get_city_from_coords(latitude, longitude)
    city = city.strip()
    
    # 2. Query ALL professionals with office locations
    cursor = db.users().find({
        "role": "professional",
        "office_location": {"$exists": True}
    })
    all_doctors = await cursor.to_list(length=200)
    
    # 3. Get user's current connections to determine status
    user_conns = []
    if current_user["role"] == "patient":
        conn_cursor = db.doctor_patient_connections().find({"patient_id": current_user["id"]})
        user_conns = await conn_cursor.to_list(length=100)
    
    conn_map = {c["doctor_id"]: c["status"] for c in user_conns}

    # 4. Filter and calculate distance
    results = []
    for d in all_doctors:
        loc = d.get("office_location", {})
        d_city = loc.get("city", "").strip()
        d_lat = loc.get("latitude")
        d_lng = loc.get("longitude")
        
        distance = None
        if d_lat is not None and d_lng is not None:
            distance = round(haversine(latitude, longitude, d_lat, d_lng), 1)
        
        # Include if city matches OR distance is within 50km
        city_match = city.lower() in d_city.lower() or d_city.lower() in city.lower()
        is_nearby = distance is not None and distance <= 50
        
        if city_match or is_nearby:
            results.append({
                "id": str(d["_id"]),
                "name": d["name"],
                "email": d["email"],
                "city": d_city,
                "address": loc.get("address"),
                "distance": distance,
                "verified": d.get("verified_credentials", False),
                "connection_status": conn_map.get(str(d["_id"]))
            })
    
    # Sort by distance if available
    results.sort(key=lambda x: x["distance"] if x["distance"] is not None else 999999)
    
    return {
        "city": city,
        "doctors": results
    }
