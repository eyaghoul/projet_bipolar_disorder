from pydantic import BaseModel, Field
from typing import List
from datetime import datetime


class QuestionnaireAnswers(BaseModel):
    """
    14 symptom features exactly matching model training columns.
    All scored 0–10 by the patient via sliders in the questionnaire UI.
    """
    Sadness: float = Field(..., ge=0, le=10)
    Euphoric: float = Field(..., ge=0, le=10)
    Exhausted: float = Field(..., ge=0, le=10)
    Sleep_dissorder: float = Field(..., ge=0, le=10, alias="Sleep dissorder")
    Mood_Swing: float = Field(..., ge=0, le=10, alias="Mood Swing")
    Suicidal_thoughts: float = Field(..., ge=0, le=10, alias="Suicidal thoughts")
    Anorxia: float = Field(..., ge=0, le=10)
    Aggressive_Response: float = Field(..., ge=0, le=10, alias="Aggressive Response")
    Nervous_Breakdown: float = Field(..., ge=0, le=10, alias="Nervous Break-down")
    Admit_Mistakes: float = Field(..., ge=0, le=10, alias="Admit Mistakes")
    Overthinking: float = Field(..., ge=0, le=10)
    Sexual_Activity: float = Field(..., ge=0, le=10, alias="Sexual Activity")
    Concentration: float = Field(..., ge=0, le=10)
    Optimisim: float = Field(..., ge=0, le=10)

    model_config = {"populate_by_name": True}

    def to_feature_dict(self) -> dict:
        """Convert to exact dict expected by the sklearn predictor."""
        return {
            "Sadness": self.Sadness,
            "Euphoric": self.Euphoric,
            "Exhausted": self.Exhausted,
            "Sleep dissorder": self.Sleep_dissorder,
            "Mood Swing": self.Mood_Swing,
            "Suicidal thoughts": self.Suicidal_thoughts,
            "Anorxia": self.Anorxia,
            "Aggressive Response": self.Aggressive_Response,
            "Nervous Break-down": self.Nervous_Breakdown,
            "Admit Mistakes": self.Admit_Mistakes,
            "Overthinking": self.Overthinking,
            "Sexual Activity": self.Sexual_Activity,
            "Concentration": self.Concentration,
            "Optimisim": self.Optimisim,
        }


class QuestionnaireSubmit(BaseModel):
    answers: QuestionnaireAnswers


class QuestionnaireOut(BaseModel):
    id: str
    patientId: str
    answers: dict
    submittedAt: datetime
