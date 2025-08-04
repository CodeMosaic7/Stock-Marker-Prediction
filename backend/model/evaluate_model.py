from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import numpy as np
import os
import pandas as pd
import matplotlib.pyplot as plt
import joblib
def evaluate_model(model, X_test, y_test, scaler, feature_columns):
    """Evaluate model performance"""
    # Make predictions
    predictions = model.predict(X_test)
    
    # Create dummy array for inverse scaling
    dummy_predictions = np.zeros((len(predictions), len(feature_columns)))
    dummy_actual = np.zeros((len(y_test), len(feature_columns)))
    
    # Place predictions and actual values in the 'close' price column (index 3)
    dummy_predictions[:, 3] = predictions.flatten()
    dummy_actual[:, 3] = y_test.flatten()
    
    # Inverse transform to get actual prices
    pred_prices = scaler.inverse_transform(dummy_predictions)[:, 3]
    actual_prices = scaler.inverse_transform(dummy_actual)[:, 3]
    
    # Calculate metrics
    mse = mean_squared_error(actual_prices, pred_prices)
    mae = mean_absolute_error(actual_prices, pred_prices)
    rmse = np.sqrt(mse)
    r2 = r2_score(actual_prices, pred_prices)
    
    # Calculate percentage accuracy
    mape = np.mean(np.abs((actual_prices - pred_prices) / actual_prices)) * 100
    
    metrics = {
        'MSE': mse,
        'MAE': mae,
        'RMSE': rmse,
        'R2': r2,
        'MAPE': mape
    }
    
    return metrics, pred_prices, actual_prices


def plot_results(history, pred_prices, actual_prices, symbol):
    """Plot training history and predictions"""
    fig, axes = plt.subplots(2, 2, figsize=(15, 10))
    
    # Training history
    axes[0, 0].plot(history.history['loss'], label='Training Loss')
    axes[0, 0].plot(history.history['val_loss'], label='Validation Loss')
    axes[0, 0].set_title('Model Loss')
    axes[0, 0].set_xlabel('Epoch')
    axes[0, 0].set_ylabel('Loss')
    axes[0, 0].legend()
    
    axes[0, 1].plot(history.history['mae'], label='Training MAE')
    axes[0, 1].plot(history.history['val_mae'], label='Validation MAE')
    axes[0, 1].set_title('Model MAE')
    axes[0, 1].set_xlabel('Epoch')
    axes[0, 1].set_ylabel('MAE')
    axes[0, 1].legend()
    
    # Predictions vs Actual
    axes[1, 0].plot(actual_prices, label='Actual', alpha=0.7)
    axes[1, 0].plot(pred_prices, label='Predicted', alpha=0.7)
    axes[1, 0].set_title(f'{symbol} Price Prediction')
    axes[1, 0].set_xlabel('Time')
    axes[1, 0].set_ylabel('Price')
    axes[1, 0].legend()
    
    # Scatter plot
    axes[1, 1].scatter(actual_prices, pred_prices, alpha=0.5)
    axes[1, 1].plot([actual_prices.min(), actual_prices.max()], 
                    [actual_prices.min(), actual_prices.max()], 'r--', lw=2)
    axes[1, 1].set_xlabel('Actual Price')
    axes[1, 1].set_ylabel('Predicted Price')
    axes[1, 1].set_title('Actual vs Predicted Prices')
    
    plt.tight_layout()
    plt.savefig(f'models/{symbol}/training_results.png', dpi=300, bbox_inches='tight')
    plt.show()

def save_model_artifacts(model, scaler, feature_columns, metrics, symbol, model_dir):
    """Save all model artifacts"""
    # Save the trained model
    model.save(f"{model_dir}/lstm_model.h5")
    
    # Save the scaler
    joblib.dump(scaler, f"{model_dir}/scaler.pkl")
    
    # Save feature columns
    joblib.dump(feature_columns, f"{model_dir}/feature_columns.pkl")
    
    # Save metrics
    joblib.dump(metrics, f"{model_dir}/metrics.pkl")
    
    # Save model summary
    with open(f"{model_dir}/model_summary.txt", 'w') as f:
        model.summary(print_fn=lambda x: f.write(x + '\n'))
    
    # Save training info
    training_info = {
        'symbol': symbol,
        'features': feature_columns,
        'metrics': metrics,
        'model_architecture': 'LSTM with technical indicators'
    }
    joblib.dump(training_info, f"{model_dir}/training_info.pkl")
    
    print(f"Model artifacts saved in: {model_dir}")
