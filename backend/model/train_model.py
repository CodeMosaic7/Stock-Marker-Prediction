import os
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
def train_model(model, X_train, y_train, X_test, y_test, symbol, epochs=100):
    """Train the LSTM model with callbacks"""
    # Create model directory
    model_dir = f"LSTM_models/{symbol}"
    os.makedirs(model_dir, exist_ok=True)
    
    # Callbacks
    callbacks = [
        EarlyStopping(
            monitor='val_loss',
            patience=15,
            restore_best_weights=True,
            verbose=1
        ),
        ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=10,
            min_lr=0.0001,
            verbose=1
        ),
        ModelCheckpoint(
            filepath=f"{model_dir}/best_model.h5",
            monitor='val_loss',
            save_best_only=True,
            verbose=1
        )
    ]
    
    # Train model
    history = model.fit(
        X_train, y_train,
        batch_size=32,
        epochs=epochs,
        validation_data=(X_test, y_test),
        callbacks=callbacks,
        verbose=1
    )
    
    return history, model_dir
