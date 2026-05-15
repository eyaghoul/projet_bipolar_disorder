from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date


class NoteCreate(BaseModel):
    patientId: str
    content: str = Field(..., min_length=1)
    sessionDate: date


class NoteOut(BaseModel):
    id: str
    professionalId: str
    patientId: str
    content: str
    sessionDate: date
    createdAt: datetime
