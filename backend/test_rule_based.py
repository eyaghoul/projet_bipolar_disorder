"""
Test the new rule-based prediction system
"""
import sys
sys.path.insert(0, '.')

from ai_model import predictor

# Feature names
FEATURE_NAMES = [
    "Sadness", "Euphoric", "Exhausted", "Sleep dissorder",
    "Mood Swing", "Suicidal thoughts", "Anorxia", "Aggressive Response",
    "Nervous Break-down", "Admit Mistakes", "Overthinking",
    "Sexual Activity", "Concentration", "Optimisim",
]

# Test cases
test_cases = [
    {
        "name": "Very low symptoms (should be Not Bipolar, high confidence)",
        "features": {name: 1.0 for name in FEATURE_NAMES}
    },
    {
        "name": "Low symptoms (should be Not Bipolar, medium confidence)",
        "features": {name: 3.0 for name in FEATURE_NAMES}
    },
    {
        "name": "Medium symptoms (uncertain)",
        "features": {name: 5.0 for name in FEATURE_NAMES}
    },
    {
        "name": "High symptoms (should be Bipolar, medium confidence)",
        "features": {name: 7.0 for name in FEATURE_NAMES}
    },
    {
        "name": "Very high symptoms (should be Bipolar, high confidence)",
        "features": {name: 10.0 for name in FEATURE_NAMES}
    },
    {
        "name": "Mixed - mostly low with some high mood indicators",
        "features": {
            "Sadness": 3.0, "Euphoric": 7.0, "Exhausted": 4.0, 
            "Sleep dissorder": 6.0, "Mood Swing": 8.0, "Suicidal thoughts": 2.0,
            "Anorxia": 3.0, "Aggressive Response": 4.0, "Nervous Break-down": 3.0,
            "Admit Mistakes": 5.0, "Overthinking": 6.0, "Sexual Activity": 5.0,
            "Concentration": 5.0, "Optimisim": 6.0
        }
    },
    {
        "name": "Mixed - high sadness but low other symptoms",
        "features": {
            "Sadness": 9.0, "Euphoric": 2.0, "Exhausted": 6.0, 
            "Sleep dissorder": 5.0, "Mood Swing": 3.0, "Suicidal thoughts": 4.0,
            "Anorxia": 3.0, "Aggressive Response": 3.0, "Nervous Break-down": 4.0,
            "Admit Mistakes": 5.0, "Overthinking": 7.0, "Sexual Activity": 5.0,
            "Concentration": 4.0, "Optimisim": 3.0
        }
    }
]

print("="*80)
print("TESTING RULE-BASED PREDICTION SYSTEM")
print("="*80)

for test in test_cases:
    print(f"\n{test['name']}:")
    result = predictor.predict_binary(test['features'])
    print(f"  Result: {result['binary_label']}")
    print(f"  Confidence: {result['confidence']:.4f} ({result['confidence']*100:.2f}%)")
