from backend.utils.fetch_data import fetch_stock_data
from backend.model.feature_engineering import create_technical_indicators
from backend.model.LSTM import build_lstm_model
from backend.model.train_model import train_model
from backend.model.evaluate_model import evaluate_model
from backend.model.predict import predict_future_prices
from backend.model.evaluate_model import save_model_artifacts
from backend.model.feature_engineering import prepare_lstm_data
from backend.utils.fetch_data import process_data
from backend.model.evaluate_model import plot_results
# from backend.model.main import main

import os
from dotenv import load_dotenv
load_dotenv()
api_key=os.getenv("ALPHA_VANTAGE_API_KEY")
def main():
    """Main function to run the complete pipeline"""
    try:
        # Configuration
        SYMBOL = "AAPL"
        INTERVAL = "5min"
        SEQUENCE_LENGTH = 60
        PREDICTION_HORIZON = 1
        EPOCHS = 100
        
        print(f"Fetching stock data for {SYMBOL}...")
        # Fetch and process data
        raw_data = fetch_stock_data(api_key, symbol=SYMBOL, interval=INTERVAL)
        df = process_data(raw_data)
        
        print(f"Creating technical indicators...")
        # Add technical indicators
        df = create_technical_indicators(df)
        
        print(f"Preparing LSTM data...")
        # Prepare data for LSTM
        X_train, X_test, y_train, y_test, scaler, feature_columns = prepare_lstm_data(
            df, sequence_length=SEQUENCE_LENGTH, prediction_horizon=PREDICTION_HORIZON
        )
        
        print(f"Data shapes - X_train: {X_train.shape}, y_train: {y_train.shape}")
        print(f"Features: {feature_columns}")
        
        # Build model
        print("Building LSTM model...")
        model = build_lstm_model(
            input_shape=(X_train.shape[1], X_train.shape[2]),
            prediction_horizon=PREDICTION_HORIZON
        )
        
        print("Model architecture:")
        model.summary()
        
        # Train model
        print("Training model...")
        history, model_dir = train_model(
            model, X_train, y_train, X_test, y_test, SYMBOL, epochs=EPOCHS
        )
        
        # Evaluate model
        print("Evaluating model...")
        metrics, pred_prices, actual_prices = evaluate_model(
            model, X_test, y_test, scaler, feature_columns
        )
        
        print("\nModel Performance Metrics:")
        for metric, value in metrics.items():
            print(f"{metric}: {value:.4f}")
        
        # Plot results
        plot_results(history, pred_prices, actual_prices, SYMBOL)
        
        # Save model artifacts
        save_model_artifacts(model, scaler, feature_columns, metrics, SYMBOL, model_dir)
        
        # Predict future prices
        print("\nPredicting next 10 time steps...")
        last_sequence = X_test[-1]  # Use last sequence from test data
        future_predictions = predict_future_prices(
            model, scaler, last_sequence, feature_columns, steps=10
        )
        
        print("Future price predictions:")
        for i, price in enumerate(future_predictions, 1):
            print(f"Step {i}: ${price:.2f}")
        
        print(f"\nTraining completed successfully!")
        print(f"Model saved in: {model_dir}")
        
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()

