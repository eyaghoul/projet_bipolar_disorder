import asyncio
from app.db import database

async def check_users():
    await database.connect_db()
    users = await database.users().find().to_list(length=100)
    print(f"Total users: {len(users)}")
    for u in users:
        print(f"- {u['name']} ({u['email']}) - Role: {u['role']}")

if __name__ == "__main__":
    asyncio.run(check_users())
