"""
Reports router — PDF generation & Google Maps nearby psychologist search.
Both endpoints are gated to premium users only.
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from bson import ObjectId

from app.services.auth_service import get_current_user, require_premium
from app.services import pdf_service, maps_service
from app.db import database as db

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/{patient_id}/pdf")
async def download_pdf_report(
    patient_id: str,
    current_user: dict = Depends(require_premium()),
):
    """Generate and stream a PDF clinical report for the requesting patient."""
    # Patients can only download their own report
    if current_user["role"] == "patient":
        patient_doc = await db.patients().find_one({"userId": current_user["id"]})
        if not patient_doc:
            raise HTTPException(status_code=403, detail="Access denied")
        patient_str_id = str(patient_doc["_id"])
        if patient_str_id != patient_id and current_user["id"] != patient_id:
            raise HTTPException(status_code=403, detail="Access denied")
        patient_id = patient_str_id  # Normalize

    # Fetch the latest screening result
    screening = await db.screenings().find_one(
        {"patientId": patient_id},
        sort=[("createdAt", -1)],
    )
    if not screening:
        raise HTTPException(
            status_code=404,
            detail="No screening results found. Complete the assessment first.",
        )

    # Fetch mood logs (up to last 30)
    cursor = db.mood_logs().find({"patientId": patient_id}, sort=[("date", -1)])
    mood_logs = await cursor.to_list(length=30)

    # Fetch user info for the report header
    try:
        user_doc = await db.users().find_one({"_id": ObjectId(current_user["id"])})
    except Exception:
        user_doc = None
    patient_info = {
        "name": user_doc.get("name", "N/A") if user_doc else "N/A",
        "email": user_doc.get("email", "N/A") if user_doc else "N/A",
    }

    pdf_bytes = pdf_service.generate_report(patient_info, screening, mood_logs)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="bipolarguide-report.pdf"'},
    )


@router.get("/nearby-psychologists")
async def nearby_psychologists(
    lat: float,
    lng: float,
    radius: int = 10000,
    current_user: dict = Depends(require_premium()),
):
    """Return nearby mental health professionals using the Google Places API."""
    providers = await maps_service.get_nearby_psychologists(lat, lng, radius)

    if not providers:
        return {
            "data": [],
            "message": "API key not configured or no results found. Add GOOGLE_MAPS_API_KEY to backend/.env",
        }

    return {"data": providers, "count": len(providers)}


@router.get("/platform-professionals")
async def platform_professionals(
    current_user: dict = Depends(get_current_user),
):
    """Return a list of mental health professionals registered on the platform."""
    cursor = db.users().find({"role": "professional"}, sort=[("name", 1)])
    docs = await cursor.to_list(length=100)
    
    # Get user's current connections to determine status
    user_conns = []
    if current_user["role"] == "patient":
        conn_cursor = db.doctor_patient_connections().find({"patient_id": current_user["id"]})
        user_conns = await conn_cursor.to_list(length=100)
        
    conn_map = {c["doctor_id"]: c["status"] for c in user_conns}
    
    return [
        {
            "id": str(d["_id"]),
            "name": d["name"],
            "email": d["email"],
            "verified": d.get("verified_credentials", False),
            "connection_status": conn_map.get(str(d["_id"]))
        }
        for d in docs
    ]
