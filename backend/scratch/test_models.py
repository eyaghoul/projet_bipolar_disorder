
import sys
import os
sys.path.append(os.getcwd())
from ai_model.predictor import load_models
from app.config import settings

print("Starting model load test...")
try:
    load_models(settings.stage1_model_path, settings.stage2_model_path)
    print("Model load test SUCCESSFUL")
except Exception as e:
    print(f"Model load test FAILED: {e}")
