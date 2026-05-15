import asyncio
import os
from app.config import settings
from app.db.database import connect_db, close_db

async def main():
    print(f"Current Working Directory: {os.getcwd()}")
    print(f"MONGODB_URI from env: {os.getenv('MONGODB_URI')}")
    print(f"Settings MONGODB_URI: {settings.mongodb_uri}")
    print("Testing connect_db...")
    try:
        await connect_db()
        print("Connected successfully!")
        await close_db()
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
