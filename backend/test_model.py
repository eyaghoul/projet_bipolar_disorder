"""
Direct model testing script to diagnose the 100% confidence issue
"""
import joblib
import numpy as np
import pandas as pd

# Load the model
model_path = "models/stage1_MLP.pkl"
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
    {
        "name": "Mixed scores - low mood symptoms",
        "features": {
            "Sadness": 2.0, "Euphoric": 1.0, "Exhausted": 3.0, 
            "Sleep dissorder": 2.0, "Mood Swing": 1.0, "Suicidal thoughts": 1.0,
            "Anorxia": 2.0, "Aggressive Response": 2.0, "Nervous Break-down": 1.0,
            "Admit Mistakes": 5.0, "Overthinking": 4.0, "Sexual Activity": 5.0,
            "Concentration": 6.0, "Optimisim": 5.0
        }
    },
    {
        "name": "Mixed scores - high mood symptoms",
        "features": {
            "Sadness": 8.0, "Euphoric": 9.0, "Exhausted": 8.0, 
            "Sleep dissorder": 9.0, "Mood Swing": 10.0, "Suicidal thoughts": 7.0,
            "Anorxia": 8.0, "Aggressive Response": 8.0, "Nervous Break-down": 9.0,
            "Admit Mistakes": 5.0, "Overthinking": 9.0, "Sexual Activity": 3.0,
            "Concentration": 3.0, "Optimisim": 8.0
        }
    }
]

print("\n" + "="*80)
print("TESTING MODEL WITH DIFFERENT INPUTS")
print("="*80)

for test in test_cases:
    print(f"\n{test['name']}:")
    print(f"Input features: {test['features']}")
    
    # Create DataFrame
    row = {name: [float(test['features'].get(name, 5.0))] for name in FEATURE_NAMES}
    df = pd.DataFrame(row)
    
    # Predict
    prediction = model.predict(df)[0]
    proba = model.predict_proba(df)[0]
    
    print(f"  Prediction: {prediction} ({'Bipolar' if prediction == 1 else 'Not Bipolar'})")
    print(f"  Probabilities: {proba}")
    print(f"  Confidence: {proba[prediction]:.4f} ({proba[prediction]*100:.2f}%)")

print("\n" + "="*80)
print("MODEL INSPECTION")
print("="*80)

# Inspect the model
if hasattr(model, 'named_steps'):
    print("\nPipeline steps:")
    for step_name, step in model.named_steps.items():
        print(f"  {step_name}: {type(step).__name__}")
        if step_name == 'model':
            print(f"    Model details: {step}")
            if hasattr(step, 'get_params'):
                params = step.get_params()
                print(f"    Key parameters:")
                for key in ['hidden_layer_sizes', 'max_iter', 'activation', 'solver', 'alpha']:
                    if key in params:
                        print(f"      {key}: {params[key]}")
