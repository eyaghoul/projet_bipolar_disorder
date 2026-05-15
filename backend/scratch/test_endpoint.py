import httpx
import asyncio

async def test_endpoint():
    async with httpx.AsyncClient() as client:
        # Login
        r = await client.post("http://127.0.0.1:8000/api/v1/auth/login", json={"email": "patient_free1@bipolarguide.com", "password": "Patient123!"})
        if r.status_code != 200:
            print("Login failed:", r.text)
            return
        token = r.json()["access_token"]
        
        # Hit endpoint
        r2 = await client.get("http://127.0.0.1:8000/api/v1/reports/platform-professionals", headers={"Authorization": f"Bearer {token}"})
        print("Status Code:", r2.status_code)
        print("Response:", r2.text)

if __name__ == "__main__":
    asyncio.run(test_endpoint())
