import joblib
import os

def check_models():
    s1_path = '../stage1_MLP.pkl'
    s2_path = '../stage2_RF.pkl'
    
    if os.path.exists(s1_path):
        print(f"Found {s1_path}")
        try:
            s1 = joblib.load(s1_path)
            print(f"Stage 1 type: {type(s1)}")
            if hasattr(s1, 'named_steps'):
                print(f"Stage 1 steps: {s1.named_steps.keys()}")
        except Exception as e:
            print(f"Error loading Stage 1: {e}")
    else:
        print(f"Missing {s1_path}")

    if os.path.exists(s2_path):
        print(f"Found {s2_path}")
        try:
            s2 = joblib.load(s2_path)
            print(f"Stage 2 type: {type(s2)}")
            if hasattr(s2, 'named_steps'):
                print(f"Stage 2 steps: {s2.named_steps.keys()}")
        except Exception as e:
            print(f"Error loading Stage 2: {e}")
    else:
        print(f"Missing {s2_path}")

if __name__ == "__main__":
    check_models()
