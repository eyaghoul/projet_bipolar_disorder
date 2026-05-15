from pydantic import BaseModel
from typing import Literal, Optional
from datetime import datetime


class AlertOut(BaseModel):
    id: str
    patientId: str
    type: str        # "manic_spike" | "rapid_cycling" | "suicidal_risk"
    severity: Literal["low", "medium", "high", "critical"]
    message: str
    triggeredAt: datetime
    resolved: bool
