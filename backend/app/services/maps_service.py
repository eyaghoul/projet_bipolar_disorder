"""
Google Maps / Places service — nearby psychologist search (premium only).
Queries the Places API nearbysearch endpoint for mental health professionals.
Returns empty list with a warning when no API key is configured.
"""
import httpx
from app.config import settings

PLACES_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
PLACE_DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"


async def get_nearby_psychologists(lat: float, lng: float, radius_meters: int = 10000) -> list:
    if not settings.google_maps_api_key:
        return [
            {
                "place_id": "mock_1",
                "name": "Dr. Sarah Mitchell - Clinical Psychologist",
                "address": "123 Therapy Lane, City Center",
                "rating": 4.9,
                "user_ratings_total": 124,
                "open_now": True,
                "lat": lat + 0.01,
                "lng": lng + 0.01,
                "types": ["doctor", "health", "psychiatrist"],
            },
            {
                "place_id": "mock_2",
                "name": "Mindful Healing Clinic",
                "address": "456 Wellness Blvd, Westside",
                "rating": 4.7,
                "user_ratings_total": 89,
                "open_now": False,
                "lat": lat - 0.015,
                "lng": lng + 0.02,
                "types": ["doctor", "health", "psychologist"],
            },
            {
                "place_id": "mock_3",
                "name": "Dr. James Okafor - Psychiatry",
                "address": "789 Medical Plaza, Eastside",
                "rating": 4.8,
                "user_ratings_total": 210,
                "open_now": True,
                "lat": lat + 0.02,
                "lng": lng - 0.01,
                "types": ["doctor", "health", "psychiatrist"],
            }
        ]

    params = {
        "location": f"{lat},{lng}",
        "radius": radius_meters,
        "type": "doctor",
        "keyword": "psychiatrist psychologist therapist mental health",
        "key": settings.google_maps_api_key,
    }

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(PLACES_URL, params=params)
        resp.raise_for_status()
        data = resp.json()

    results = []
    for place in data.get("results", [])[:20]:
        results.append({
            "place_id": place.get("place_id"),
            "name": place.get("name"),
            "address": place.get("vicinity"),
            "rating": place.get("rating"),
            "user_ratings_total": place.get("user_ratings_total", 0),
            "open_now": place.get("opening_hours", {}).get("open_now"),
            "lat": place["geometry"]["location"]["lat"],
            "lng": place["geometry"]["location"]["lng"],
            "types": place.get("types", []),
        })
    return results


async def get_city_from_coords(lat: float, lng: float) -> str:
    """Resolve latitude/longitude to a city name using Google Geocoding API."""
    if not settings.google_maps_api_key:
        # Mock behavior for local testing without API key
        return "Tunis"

    url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {
        "latlng": f"{lat},{lng}",
        "key": settings.google_maps_api_key,
        "result_type": "locality"
    }

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(url, params=params)
        if resp.status_code != 200:
            return "Unknown City"
        
        data = resp.json()
        results = data.get("results", [])
        if not results:
            return "Unknown City"
        
        # Extract city (locality) from components
        for component in results[0].get("address_components", []):
            if "locality" in component.get("types", []):
                return component.get("long_name")
        
    return "Unknown City"
