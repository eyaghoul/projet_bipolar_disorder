from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class TopFeature(BaseModel):
    feature: str
    importance: float
    user_score: float
    explanation: str


class ScreeningResult(BaseModel):
    id: str
    patientId: str
    modelVersion: str
    binary_label: str           # "Bipolar" | "Not Bipolar"
    confidence: float           # 0.0 – 1.0
    # Premium-only fields (None for free tier)
    multiclass_label: Optional[str] = None    # "Type I" | "Type II" | "Depressive Episode"
    multiclass_confidence: Optional[float] = None
    top_features: Optional[List[TopFeature]] = None
    plan: str                   # "free" | "premium"
    createdAt: datetime


class ScreeningHistoryItem(BaseModel):
    id: str
    binary_label: str
    confidence: float
    multiclass_label: Optional[str] = None
    plan: str
    createdAt: datetime
