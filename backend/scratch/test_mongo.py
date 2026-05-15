import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys

async def test_connection():
    uri = "mongodb://127.0.0.1:27017/bipolarguide"
    print(f"Connecting to {uri}...")
    client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000)
    db = client.get_default_database()
    try:
        print("Testing create_index...")
        await db.users.create_index("email", unique=True)
        print("create_index successful!")
    except Exception as e:
        print(f"Operation failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(test_connection())
