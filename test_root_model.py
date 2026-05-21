"""
Test the root stage1_MLP.pkl file
"""
import joblib
import numpy as np
import pandas as pd

# Load the ROOT model
model_path = "stage1_MLP.pkl"
print(f"Loading model from: {model_path}")
model = joblib.load(model_path)

print(f"\nModel type: {type(model)}")
print(f"Model steps: {model.named_steps if hasattr(model, 'named_steps') else 'N/A'}")

# Feature names
FEATURE_NAMES = [
    "Sadness", "Euphoric", "Exhausted", "Sleep dissorder",
    "Mood Swing", "Suicidal thoughts", "Anorxia", "Aggressive Response",
    "Nervous Break-down", "Admit Mistakes", "Overthinking",
    "Sexual Activity", "Concentration", "Optimisim",
]

# Test with different input patterns
test_cases = [
    {
        "name": "All low scores (should be Not Bipolar)",
        "features": {name: 1.0 for name in FEATURE_NAMES}
    },
    {
        "name": "All medium scores",
        "features": {name: 5.0 for name in FEATURE_NAMES}
    },
    {
        "name": "All high scores (should be Bipolar)",
        "features": {name: 10.0 for name in FEATURE_NAMES}
    },
]

print("\n" + "="*80)
print("TESTING ROOT MODEL")
print("="*80)

for test in test_cases:
    print(f"\n{test['name']}:")
    
    # Create DataFrame
    row = {name: [float(test['features'].get(name, 5.0))] for name in FEATURE_NAMES}
    df = pd.DataFrame(row)
    
    # Predict
    prediction = model.predict(df)[0]
    proba = model.predict_proba(df)[0]
    
    print(f"  Prediction: {prediction} ({'Bipolar' if prediction == 1 else 'Not Bipolar'})")
    print(f"  Probabilities: {proba}")
    print(f"  Confidence: {proba[prediction]:.4f} ({proba[prediction]*100:.2f}%)")
