from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from model import get_predictions  # Your function to return predicted & actual

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/predict")
def predict():
    predicted, actual = get_predictions()
    return {"predicted": predicted.tolist(), "actual": actual.tolist()}
