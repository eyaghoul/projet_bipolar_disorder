"""
Seed script — populates all MongoDB collections with realistic demo data.
Run inside Docker: docker compose exec backend python seed/seed.py
Or locally:        cd backend && python seed/seed.py

Credentials printed to console after seeding.
"""
import asyncio
import sys
import os
from datetime import datetime, timezone, timedelta, date
import random

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from bson import ObjectId
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/bipolarguide")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def h(p): return pwd_context.hash(p)
def now(): return datetime.now(timezone.utc)
def days_ago(n): return now() - timedelta(days=n)


FEATURES_BIPOLAR = {
    "Sadness": 8, "Euphoric": 7, "Exhausted": 8, "Sleep dissorder": 7,
    "Mood Swing": 9, "Suicidal thoughts": 3, "Anorxia": 5,
    "Aggressive Response": 6, "Nervous Break-down": 7, "Admit Mistakes": 4,
    "Overthinking": 8, "Sexual Activity": 7, "Concentration": 3, "Optimisim": 8,
}
FEATURES_NOT_BIPOLAR = {
    "Sadness": 2, "Euphoric": 2, "Exhausted": 3, "Sleep dissorder": 2,
    "Mood Swing": 2, "Suicidal thoughts": 0, "Anorxia": 1,
    "Aggressive Response": 1, "Nervous Break-down": 2, "Admit Mistakes": 7,
    "Overthinking": 3, "Sexual Activity": 4, "Concentration": 8, "Optimisim": 3,
}


async def seed():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client.get_default_database()

    # Drop existing data
    for col in ["users", "patients", "questionnaires", "screenings",
                "mood_logs", "clinical_notes", "alerts", "feedback",
                "audit_logs", "payments"]:
        await db[col].drop()
    print("🗑️  Cleared existing collections")

    # ── Users ────────────────────────────────────────────────────────────────
    admin_id = ObjectId()
    pro1_id = ObjectId()
    pro2_id = ObjectId()

    users = [
        {"_id": admin_id, "name": "System Admin", "email": "admin@bipolarguide.com",
         "passwordHash": h("Admin123!"), "role": "admin", "plan": "premium",
         "status": "active", "createdAt": days_ago(60)},
        {"_id": pro1_id, "name": "Dr. Sarah Mitchell", "email": "pro1@bipolarguide.com",
         "passwordHash": h("Pro123!"), "role": "professional", "plan": "premium",
         "status": "active", "createdAt": days_ago(50)},
        {"_id": pro2_id, "name": "Dr. James Okafor", "email": "pro2@bipolarguide.com",
         "passwordHash": h("Pro123!"), "role": "professional", "plan": "premium",
         "status": "active", "createdAt": days_ago(45)},
    ]

    free_patients = []
    premium_patients = []

    free_names = [
        ("Alice Harper", "patient_free1@bipolarguide.com"),
        ("Bob Chen", "patient_free2@bipolarguide.com"),
        ("Carol White", "patient_free3@bipolarguide.com"),
        ("David Kim", "patient_free4@bipolarguide.com"),
        ("Eva Torres", "patient_free5@bipolarguide.com"),
    ]
    premium_names = [
        ("Frank Müller", "patient_premium1@bipolarguide.com"),
        ("Grace Lee", "patient_premium2@bipolarguide.com"),
        ("Henry Brown", "patient_premium3@bipolarguide.com"),
        ("Isla Patel", "patient_premium4@bipolarguide.com"),
        ("Jack Wilson", "patient_premium5@bipolarguide.com"),
    ]

    for name, email in free_names:
        uid = ObjectId()
        users.append({"_id": uid, "name": name, "email": email,
                      "passwordHash": h("Patient123!"), "role": "patient",
                      "plan": "free", "status": "active", "createdAt": days_ago(random.randint(10, 40))})
        free_patients.append(uid)

    for name, email in premium_names:
        uid = ObjectId()
        users.append({"_id": uid, "name": name, "email": email,
                      "passwordHash": h("Patient123!"), "role": "patient",
                      "plan": "premium", "status": "active", "createdAt": days_ago(random.randint(10, 40))})
        premium_patients.append(uid)

    await db.users.insert_many(users)
    print(f"✅ Inserted {len(users)} users")

    # ── Patients profiles ────────────────────────────────────────────────────
    all_patient_ids = free_patients + premium_patients
    patient_profile_map = {}  # user_id -> patient profile _id
    patient_docs = []
    for i, uid in enumerate(all_patient_ids):
        pid = ObjectId()
        patient_profile_map[str(uid)] = pid
        patient_docs.append({
            "_id": pid,
            "userId": str(uid),
            "assignedProfessionalId": str(pro1_id) if i % 2 == 0 else str(pro2_id),
            "demographics": {"age": random.randint(20, 55), "gender": random.choice(["Male", "Female", "Non-binary"])},
            "createdAt": days_ago(random.randint(5, 30)),
        })
    await db.patients.insert_many(patient_docs)
    print(f"✅ Inserted {len(patient_docs)} patient profiles")

    # ── Questionnaires & Screenings ──────────────────────────────────────────
    q_docs, s_docs = [], []
    for uid in all_patient_ids:
        pid = patient_profile_map[str(uid)]
        user = next(u for u in users if u["_id"] == uid)
        is_premium = user["plan"] == "premium"
        features = FEATURES_BIPOLAR if uid in premium_patients else FEATURES_NOT_BIPOLAR

        for _ in range(2):
            noisy = {k: min(10, max(0, v + random.randint(-1, 1))) for k, v in features.items()}
            qid = ObjectId()
            q_docs.append({"_id": qid, "patientId": str(pid), "answers": noisy,
                           "submittedAt": days_ago(random.randint(1, 20))})

            binary = "Bipolar" if uid in premium_patients else "Not Bipolar"
            conf = round(random.uniform(0.78, 0.97), 4)
            sdoc = {
                "patientId": str(pid),
                "modelVersion": "stage1-MLP_stage2-RF_v1",
                "binary_label": binary,
                "confidence": conf,
                "multiclass_label": random.choice(["Bipolar Type I", "Bipolar Type II", "Depressive Episode"]) if is_premium and binary == "Bipolar" else None,
                "multiclass_confidence": round(random.uniform(0.6, 0.9), 4) if is_premium and binary == "Bipolar" else None,
                "top_features": [
                    {"feature": "Mood Swing", "importance": 0.47, "user_score": noisy.get("Mood Swing", 5),
                     "explanation": "Your reported dramatic mood fluctuations (score: {}/10) was a significant factor.".format(noisy.get("Mood Swing", 5))},
                    {"feature": "Euphoric", "importance": 0.23, "user_score": noisy.get("Euphoric", 5),
                     "explanation": "Your reported episodes of euphoria (score: {}/10) was a significant factor.".format(noisy.get("Euphoric", 5))},
                    {"feature": "Sexual Activity", "importance": 0.16, "user_score": noisy.get("Sexual Activity", 5),
                     "explanation": "Your reported changes in sexual activity (score: {}/10) was a significant factor.".format(noisy.get("Sexual Activity", 5))},
                ] if is_premium and binary == "Bipolar" else None,
                "plan": user["plan"],
                "createdAt": days_ago(random.randint(1, 15)),
            }
            s_docs.append(sdoc)

    await db.questionnaires.insert_many(q_docs)
    await db.screenings.insert_many(s_docs)
    print(f"✅ Inserted {len(q_docs)} questionnaires, {len(s_docs)} screenings")

    # ── Mood logs (30 days per patient) ─────────────────────────────────────
    mood_docs = []
    for uid in all_patient_ids:
        pid = patient_profile_map[str(uid)]
        is_bipolar = uid in premium_patients
        for day_offset in range(30):
            d = (now() - timedelta(days=day_offset)).date()
            mood = random.randint(6, 9) if is_bipolar and day_offset % 7 < 3 else random.randint(2, 5) if is_bipolar else random.randint(4, 7)
            mood_docs.append({
                "patientId": str(pid),
                "date": d.isoformat(),
                "mood": mood,
                "sleep": round(random.uniform(4.0, 9.0), 1),
                "energy": random.randint(1, 10),
                "irritability": random.randint(1, 10),
                "notes": random.choice(["Felt okay today", "Struggled with focus", "Good day overall", None, None]),
                "createdAt": datetime.combine(d, datetime.min.time()).replace(tzinfo=timezone.utc),
            })
    await db.mood_logs.insert_many(mood_docs)
    print(f"✅ Inserted {len(mood_docs)} mood logs")

    # ── Clinical notes ───────────────────────────────────────────────────────
    note_templates = [
        "Patient reports significant improvement in sleep patterns. Continue current approach.",
        "Noticeable mood elevation observed. Monitoring for potential manic symptoms.",
        "Patient expressed concern about medication side effects. Referred to prescribing physician.",
        "Session focused on CBT techniques for managing mood swings. Patient receptive.",
        "Patient disclosed recent stressors at work. Developing coping strategies.",
    ]
    note_docs = []
    for uid in all_patient_ids:
        pid = patient_profile_map[str(uid)]
        for i in range(3):
            note_docs.append({
                "professionalId": str(pro1_id) if random.random() > 0.5 else str(pro2_id),
                "patientId": str(pid),
                "content": random.choice(note_templates),
                "sessionDate": (now() - timedelta(days=i * 7)).date().isoformat(),
                "createdAt": days_ago(i * 7),
            })
    await db.clinical_notes.insert_many(note_docs)
    print(f"✅ Inserted {len(note_docs)} clinical notes")

    # ── Alerts (premium patients) ────────────────────────────────────────────
    alert_docs = []
    for uid in premium_patients[:3]:
        pid = patient_profile_map[str(uid)]
        alert_docs.append({
            "patientId": str(pid),
            "type": "manic_spike",
            "severity": "high",
            "message": "Mood score ≥ 8 for 3 consecutive days — possible manic episode.",
            "triggeredAt": days_ago(2),
            "resolved": False,
        })
    await db.alerts.insert_many(alert_docs)
    print(f"✅ Inserted {len(alert_docs)} alerts")

    # ── Feedback ─────────────────────────────────────────────────────────────
    screening_sample = await db.screenings.find().to_list(length=3)
    fb_docs = []
    for s in screening_sample:
        fb_docs.append({
            "screeningId": str(s["_id"]),
            "professionalId": str(pro1_id),
            "correctedLabel": random.choice(["Bipolar Type I", "Not Bipolar", "Depressive Episode"]),
            "comment": "Clinical assessment suggests different classification.",
            "createdAt": days_ago(random.randint(1, 5)),
        })
    await db.feedback.insert_many(fb_docs)
    print(f"✅ Inserted {len(fb_docs)} feedback records")

    # ── Audit logs ───────────────────────────────────────────────────────────
    actions = ["login", "register", "run_screening", "submit_questionnaire", "create_mood_log"]
    audit_docs = []
    for i in range(25):
        user = random.choice(users)
        audit_docs.append({
            "userId": str(user["_id"]),
            "userEmail": user["email"],
            "action": random.choice(actions),
            "targetResource": random.choice(["users", "screenings", "mood_logs"]),
            "targetId": str(ObjectId()),
            "ip": f"192.168.1.{random.randint(1, 254)}",
            "timestamp": days_ago(random.randint(0, 30)),
        })
    await db.audit_logs.insert_many(audit_docs)
    print(f"✅ Inserted {len(audit_docs)} audit log entries")

    # ── Payments (premium users) ─────────────────────────────────────────────
    pay_docs = []
    for uid in premium_patients:
        pay_docs.append({
            "userId": str(uid),
            "amount": 9.99,
            "currency": "USD",
            "status": "succeeded",
            "provider": "mock",
            "createdAt": days_ago(random.randint(5, 30)),
        })
    await db.payments.insert_many(pay_docs)
    print(f"✅ Inserted {len(pay_docs)} payment records")

    client.close()
    print("\n" + "="*50)
    print("🎉 SEED COMPLETE — Demo Credentials")
    print("="*50)
    print("Admin:            admin@bipolarguide.com   / Admin123!")
    print("Professional 1:   pro1@bipolarguide.com    / Pro123!")
    print("Professional 2:   pro2@bipolarguide.com    / Pro123!")
    print("Free Patient:     patient_free1@bipolarguide.com / Patient123!")
    print("Premium Patient:  patient_premium1@bipolarguide.com / Patient123!")
    print("="*50)


if __name__ == "__main__":
    asyncio.run(seed())
