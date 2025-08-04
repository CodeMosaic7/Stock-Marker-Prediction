from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout, BatchNormalization
from tensorflow.keras.optimizers import Adam

# intialising the LSTM model
def build_lstm_model(input_shape, prediction_horizon=1):
    """Build and compile LSTM model"""
    model = Sequential([
        # First LSTM layer
        LSTM(128, return_sequences=True, input_shape=input_shape),
        Dropout(0.2),
        BatchNormalization(),
        
        # Second LSTM layer
        LSTM(64, return_sequences=True),
        Dropout(0.2),
        BatchNormalization(),
        
        # Third LSTM layer
        LSTM(32, return_sequences=False),
        Dropout(0.2),
        
        # Dense layers
        Dense(25, activation='relu'),
        Dropout(0.1),
        Dense(prediction_horizon)
    ])
    
    # Compile model
    model.compile(
        optimizer=Adam(learning_rate=0.001),
        loss='mse',
        metrics=['mae']
    )
    
    return model