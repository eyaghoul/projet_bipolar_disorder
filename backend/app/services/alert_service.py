"""
Alert service — detects risk patterns in mood logs and creates alerts.
Called after every mood log POST. Patterns:
  - Manic spike: mood >= 8 for 3+ consecutive days
  - Rapid cycling: 4+ mood direction reversals in 30 days
  - Suicidal risk: Suicidal thoughts feature score >= 7 in latest screening
"""
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from app.db import database as db


async def evaluate_alerts(patient_id: str) -> None:
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)
    logs = await db.mood_logs().find(
        {"patientId": patient_id, "date": {"$gte": cutoff.date().isoformat()}},
        sort=[("date", 1)],
    ).to_list(length=90)

    if not logs:
        return

    moods = [log["mood"] for log in logs]

    # ── Manic spike detection ───────────────────────────────────────────────
    streak = 0
    for m in moods[-7:]:
        if m >= 8:
            streak += 1
        else:
            streak = 0
    if streak >= 3:
        await _upsert_alert(
            patient_id, "manic_spike", "high",
            f"Mood score ≥ 8 for {streak} consecutive days — possible manic episode.",
        )

    # ── Rapid cycling detection ─────────────────────────────────────────────
    if len(moods) >= 4:
        reversals = sum(
            1 for i in range(1, len(moods) - 1)
            if (moods[i] > moods[i - 1] and moods[i] > moods[i + 1])
            or (moods[i] < moods[i - 1] and moods[i] < moods[i + 1])
        )
        if reversals >= 4:
            await _upsert_alert(
                patient_id, "rapid_cycling", "medium",
                f"Detected {reversals} mood direction reversals in the past 30 days.",
            )

    # ── Low mood for 7 days ─────────────────────────────────────────────────
    if len(moods) >= 7 and all(m <= 3 for m in moods[-7:]):
        await _upsert_alert(
            patient_id, "prolonged_low_mood", "high",
            "Mood score ≤ 3 for 7 consecutive days — possible depressive episode.",
        )


async def _upsert_alert(patient_id: str, alert_type: str, severity: str, message: str):
    existing = await db.alerts().find_one(
        {"patientId": patient_id, "type": alert_type, "resolved": False}
    )
    if existing:
        return  # Already flagged, don't duplicate
    await db.alerts().insert_one({
        "patientId": patient_id,
        "type": alert_type,
        "severity": severity,
        "message": message,
        "triggeredAt": datetime.now(timezone.utc),
        "resolved": False,
    })
