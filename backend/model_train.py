from utils.fetch_data import fetch_stock_data,process_data
from sklearn.preprocessing import MinMaxScaler

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
import numpy as np
import joblib
import os
from dotenv import load_dotenv
load_dotenv()
API_KEY=os.getenv("ALPHA_VANTAGE_API_KEY")
# Fetch and preprocess
df = fetch_stock_data(API_KEY,"AAPL", interval="5min")
df = process_data(df)
scaler = MinMaxScaler()
scaled_data = scaler.fit_transform(df)

X, y = [], []
window_size = 60
for i in range(window_size, len(scaled_data)):
    X.append(scaled_data[i - window_size:i, 0])
    y.append(scaled_data[i, 0])
X, y = np.array(X), np.array(y)
X = np.reshape(X, (X.shape[0], X.shape[1], 1))


model = Sequential([
    LSTM(50, return_sequences=True, input_shape=(X.shape[1], 1)),
    LSTM(50),
    Dense(1)
])
model.compile(optimizer='adam', loss='mse')
model.fit(X, y, epochs=5, batch_size=32)


# os.makedirs("app/model", exist_ok=True)
model.save("model/lstm_model.h5")
# joblib.dump(scaler, "data/scaler.pkl")
