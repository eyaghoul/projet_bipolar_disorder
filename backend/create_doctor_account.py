import asyncio
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from app.services.auth_service import hash_password

async def create_doctor():
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.bipolarguide
    
    # Doctor account details
    email = "doctoreya@gmail.com"
    password = "password123"  # You can change this
    name = "Dr. Eya"
    
    # Check if account already exists
    existing = await db.users.find_one({"email": email})
    if existing:
        print(f"Account {email} already exists!")
        return
    
    # Create the account
    now = datetime.now(timezone.utc)
    user_doc = {
        "name": name,
        "email": email,
        "passwordHash": hash_password(password),
        "role": "professional",
        "plan": "premium",  # Already premium!
        "status": "active",
        "createdAt": now,
    }
    
    result = await db.users.insert_one(user_doc)
    print(f"✓ Created doctor account!")
    print(f"  Email: {email}")
    print(f"  Password: {password}")
    print(f"  Role: professional")
    print(f"  Plan: premium")
    print(f"  ID: {result.inserted_id}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_doctor())
