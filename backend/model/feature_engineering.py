import numpy as np
from sklearn.preprocessing import MinMaxScaler
def create_technical_indicators(df):
    """Create technical indicators for better prediction"""
    # Simple Moving Averages
    df['SMA_5'] = df['close'].rolling(window=5).mean()
    df['SMA_20'] = df['close'].rolling(window=20).mean()
    
    # Exponential Moving Average
    df['EMA_12'] = df['close'].ewm(span=12).mean()
    
    # Relative Strength Index (RSI)
    delta = df['close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    df['RSI'] = 100 - (100 / (1 + rs))
    
    # Bollinger Bands
    df['BB_middle'] = df['close'].rolling(window=20).mean()
    bb_std = df['close'].rolling(window=20).std()
    df['BB_upper'] = df['BB_middle'] + (bb_std * 2)
    df['BB_lower'] = df['BB_middle'] - (bb_std * 2)
    
    # MACD
    exp1 = df['close'].ewm(span=12).mean()
    exp2 = df['close'].ewm(span=26).mean()
    df['MACD'] = exp1 - exp2
    df['MACD_signal'] = df['MACD'].ewm(span=9).mean()
    
    # Volume indicators
    df['volume_sma'] = df['volume'].rolling(window=20).mean()
    df['volume_ratio'] = df['volume'] / df['volume_sma']
    
    # Price volatility
    df['volatility'] = df['close'].rolling(window=20).std()
    
    # Price change percentage
    df['price_change'] = df['close'].pct_change()
    
    return df


# to prepare data for LSTM model
def prepare_lstm_data(df, sequence_length=60, prediction_horizon=1):
    """Prepare data for LSTM model"""
    # Select features for training
    feature_columns = [
        'open', 'high', 'low', 'close', 'volume',
        'SMA_5', 'SMA_20', 'EMA_12', 'RSI',
        'BB_upper', 'BB_lower', 'MACD', 'MACD_signal',
        'volume_ratio', 'volatility', 'price_change'
    ]
    
    # Remove rows with NaN values
    df_clean = df[feature_columns].dropna()
    
    if len(df_clean) < sequence_length + prediction_horizon:
        raise ValueError(f"Not enough data. Need at least {sequence_length + prediction_horizon} rows")
    
    # Scale the data
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled_data = scaler.fit_transform(df_clean)
    
    # Create sequences
    X, y = [], []
    for i in range(sequence_length, len(scaled_data) - prediction_horizon + 1):
        X.append(scaled_data[i-sequence_length:i])
        # Predict the 'close' price (index 3 in feature_columns)
        y.append(scaled_data[i:i+prediction_horizon, 3])  # close price index
    
    X, y = np.array(X), np.array(y)
    
    # Split data into train and test sets
    train_size = int(len(X) * 0.8)
    X_train, X_test = X[:train_size], X[train_size:]
    y_train, y_test = y[:train_size], y[train_size:]
    
    return X_train, X_test, y_train, y_test, scaler, feature_columns
