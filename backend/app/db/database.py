from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings
import asyncio

_client: AsyncIOMotorClient = None
_db: AsyncIOMotorDatabase = None


async def connect_db():
    global _client, _db
    print(f"Connecting to MongoDB at {settings.mongodb_uri}...")
    _client = AsyncIOMotorClient(settings.mongodb_uri, serverSelectionTimeoutMS=5000)
    
    try:
        print("Pinging MongoDB...")
        await _client.admin.command('ping')
        print("Ping successful!")
        
        _db = _client.get_default_database()
        print(f"Using database: {_db.name}")
        
        # Create indexes
        print("Ensuring indexes...")
        await _db.users.create_index("email", unique=True)
        print("Index on users ensured")
        await _db.mood_logs.create_index([("patientId", 1), ("date", -1)])
        print("Index on mood_logs ensured")
        await _db.screenings.create_index([("patientId", 1), ("createdAt", -1)])
        await _db.audit_logs.create_index("timestamp")
        await _db.alerts.create_index([("patientId", 1), ("resolved", 1)])
        print("MongoDB connected and all indexes ensured")
    except Exception as e:
        print(f"FAILED to connect to MongoDB: {e}")
        raise


async def close_db():
    global _client
    if _client:
        _client.close()
        print("MongoDB connection closed")


def get_db() -> AsyncIOMotorDatabase:
    return _db


# Collection accessors
def users():
    return _db["users"]

def patients():
    return _db["patients"]

def questionnaires():
    return _db["questionnaires"]

def screenings():
    return _db["screenings"]

def mood_logs():
    return _db["mood_logs"]

def clinical_notes():
    return _db["clinical_notes"]

def alerts():
    return _db["alerts"]

def feedback():
    return _db["feedback"]

def audit_logs():
    return _db["audit_logs"]

def payments():
    return _db["payments"]

def doctor_patient_connections():
    return _db["doctor_patient_connections"]
