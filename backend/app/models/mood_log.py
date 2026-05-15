from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date


class MoodLogCreate(BaseModel):
    date: date
    mood: int = Field(..., ge=1, le=10)
    sleep: float = Field(..., ge=0, le=24, description="Hours of sleep")
    energy: int = Field(..., ge=1, le=10)
    irritability: int = Field(..., ge=1, le=10)
    notes: Optional[str] = Field(None, max_length=1000)


class MoodLogOut(BaseModel):
    id: str
    patientId: str
    date: date
    mood: int
    sleep: float
    energy: int
    irritability: int
    notes: Optional[str] = None
    createdAt: datetime
