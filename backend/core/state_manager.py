import os
import pickle
import json

STATE_DIR="state"

os.makedirs(STATE_DIR, exist_ok=True)

def save_json(data, filename):
    with open(os.path.join(STATE_DIR, filename), "w") as f:
        json.dump(data, f)

def load_json(filename):
    path = os.path.join(STATE_DIR, filename)
    if os.path.exists(path):
        with open(path, "r") as f:
            return json.load(f)
    return {}

def save_pickle(data, filename):
    with open(os.path.join(STATE_DIR, filename), "wb") as f:
        pickle.dump(data, f)

def load_pickle(filename):
    path = os.path.join(STATE_DIR, filename)
    if os.path.exists(path):
        with open(path, "rb") as f:
            return pickle.load(f)
    return {}