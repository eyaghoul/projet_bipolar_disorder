from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime


class FeedbackCreate(BaseModel):
    correctedLabel: Literal[
        "Not Bipolar", "Depressive Episode", "Bipolar Type I", "Bipolar Type II"
    ]
    comment: Optional[str] = Field(None, max_length=500)


class FeedbackOut(BaseModel):
    id: str
    screeningId: str
    professionalId: str
    correctedLabel: str
    comment: Optional[str] = None
    createdAt: datetime
