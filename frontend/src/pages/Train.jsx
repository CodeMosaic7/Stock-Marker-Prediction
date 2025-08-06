import { useState , useEffect} from "react";
import styles from "../styles"
import { 
  startTraining, 
  getTrainingStatus, 
  pollTrainingStatus, 
  formatErrorMessage, 
  checkModelExists, 
  deleteModel,
  getAvailableModels 
} from '../api/api'; // Import from your API module

const Train = () => {
  const [symbol, setSymbol] = useState('AAPL');
  const [interval, setInterval] = useState('5min');
  const [epochs, setEpochs] = useState(50);
  const [sequenceLength, setSequenceLength] = useState(60);
  const [predictionHorizon, setPredictionHorizon] = useState(1);
  const [loading, setLoading] = useState(false);
  const [trainingStatus, setTrainingStatus] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [existingModel, setExistingModel] = useState(null);
  const [models, setModels] = useState([]);

  // Check for existing model when symbol changes
  useEffect(() => {
    checkExistingModel();
  }, [symbol]);

  // Load available models on component mount
  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const modelsData = await getAvailableModels();
      setModels(modelsData.models || []);
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const checkExistingModel = async () => {
    if (!symbol.trim()) return;
    
    try {
      const exists = await checkModelExists(symbol);
      if (exists) {
        const modelInfo = models.find(m => 
          m.symbol.toUpperCase() === symbol.toUpperCase()
        );
        setExistingModel(modelInfo);
      } else {
        setExistingModel(null);
      }
    } catch (error) {
      console.error('Error checking model:', error);
    }
  };

  const trainModel = async () => {
    if (!symbol.trim()) {
      setError('Please enter a stock symbol');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setTrainingStatus(null);

    const trainingConfig = {
      symbol,
      interval,
      epochs: parseInt(epochs),
      sequence_length: parseInt(sequenceLength),
      prediction_horizon: parseInt(predictionHorizon)
    };

    try {
      const response = await startTraining(trainingConfig);
      
      // Start polling for training status
      pollTrainingStatus(symbol, (status) => {
        setTrainingStatus(status);
        
        if (status.status === 'completed') {
          setResult(status);
          setLoading(false);
          loadModels(); // Refresh models list
          checkExistingModel(); // Update existing model status
        } else if (status.status === 'error') {
          setError(status.message || 'Training failed');
          setLoading(false);
        }
      });

    } catch (error) {
      setError(formatErrorMessage(error));
      setLoading(false);
    }
  };

  const handleDeleteModel = async () => {
    if (!existingModel) return;
    
    if (window.confirm(`Are you sure you want to delete the model for ${symbol}? This action cannot be undone.`)) {
      try {
        await deleteModel(symbol);
        setExistingModel(null);
        loadModels();
        setResult(null);
      } catch (error) {
        setError(formatErrorMessage(error));
      }
    }
  };

  const getTrainingProgress = () => {
    if (!trainingStatus || !trainingStatus.current_epoch || !trainingStatus.total_epochs) {
      return 0;
    }
    return Math.round((trainingStatus.current_epoch / trainingStatus.total_epochs) * 100);
  };

  const isTraining = loading && trainingStatus?.status === 'training';

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '30px', color: '#fff', textAlign: 'center' }}>
          🤖 Model Training Center
        </h1>

        {/* Existing Model Information */}
        {existingModel && (
          <div style={styles.modelInfo}>
            <div style={styles.flexContainer}>
              <div style={{ flex: 1 }}>
                <h3 style={{ color: '#4ecdc4', marginBottom: '10px' }}>
                  ✅ Existing Model Found for {symbol}
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.8)', margin: '5px 0' }}>
                  Last updated: {new Date(existingModel.last_updated).toLocaleString()}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.8)', margin: '5px 0' }}>
                  Status: {existingModel.files_present ? 'Ready for predictions' : 'Incomplete'}
                </p>
              </div>
              <button
                style={styles.buttonSecondary}
                onClick={handleDeleteModel}
                title="Delete existing model"
              >
                🗑️ Delete Model
              </button>
            </div>
          </div>
        )}

        <div style={styles.card}>
          <h2 style={{ color: '#fff', marginBottom: '25px' }}>⚙️ Training Configuration</h2>
          
          <div style={styles.grid}>
            <div style={styles.configItem}>
              <label style={styles.label}>Stock Symbol:</label>
              <input
                style={styles.input}
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="Enter stock symbol (e.g., AAPL)"
                disabled={loading}
              />
              <div style={styles.helpText}>
                The stock ticker symbol to train the model on
              </div>
            </div>

            <div style={styles.configItem}>
              <label style={styles.label}>Data Interval:</label>
              <select
                style={styles.select}
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                disabled={loading}
              >
                <option value="1min">1 Minute</option>
                <option value="5min">5 Minutes</option>
                <option value="15min">15 Minutes</option>
                <option value="30min">30 Minutes</option>
                <option value="60min">1 Hour</option>
                <option value="1day">1 Day</option>
              </select>
              <div style={styles.helpText}>
                Time interval for historical data points
              </div>
            </div>

            <div style={styles.configItem}>
              <label style={styles.label}>Epochs:</label>
              <input
                style={styles.input}
                type="number"
                value={epochs}
                onChange={(e) => setEpochs(e.target.value)}
                min="10"
                max="200"
                disabled={loading}
              />
              <div style={styles.helpText}>
                Number of training iterations (10-200, recommended: 50-100)
              </div>
            </div>

            <div style={styles.configItem}>
              <label style={styles.label}>Sequence Length:</label>
              <input
                style={styles.input}
                type="number"
                value={sequenceLength}
                onChange={(e) => setSequenceLength(e.target.value)}
                min="20"
                max="200"
                disabled={loading}
              />
              <div style={styles.helpText}>
                Number of historical data points to analyze (20-200)
              </div>
            </div>

            <div style={styles.configItem}>
              <label style={styles.label}>Prediction Horizon:</label>
              <input
                style={styles.input}
                type="number"
                value={predictionHorizon}
                onChange={(e) => setPredictionHorizon(e.target.value)}
                min="1"
                max="10"
                disabled={loading}
              />
              <div style={styles.helpText}>
                Number of future periods to predict (1-10)
              </div>
            </div>
          </div>

          <div style={styles.flexContainer}>
            <button
              style={{
                ...styles.button,
                ...(loading ? styles.buttonDisabled : {})
              }}
              onClick={trainModel}
              disabled={loading}
            >
              {loading ? '🔄 Training...' : '🚀 Start Training'}
            </button>

            {existingModel && (
              <div style={{ color: '#ffc107', fontSize: '14px' }}>
                ⚠️ Training will overwrite the existing model
              </div>
            )}
          </div>

          {error && <div style={styles.error}>❌ {error}</div>}
          
          {existingModel && !loading && !error && (
            <div style={styles.warning}>
              ⚠️ A trained model already exists for {symbol}. Training will replace the current model.
            </div>
          )}
        </div>

        {/* Training Status */}
        {isTraining && trainingStatus && (
          <div style={styles.card}>
            <h2 style={{ color: '#fff', marginBottom: '20px' }}>📊 Training Progress</h2>
            
            <div style={styles.statusContainer}>
              <div style={styles.flexContainer}>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#4ecdc4', fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px 0' }}>
                    Training {trainingStatus.symbol}...
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.8)', margin: '5px 0' }}>
                    Epoch: {trainingStatus.current_epoch || 0} / {trainingStatus.total_epochs || epochs}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.8)', margin: '5px 0' }}>
                    Current Loss: {trainingStatus.current_loss?.toFixed(6) || 'N/A'}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.8)', margin: '5px 0' }}>
                    Status: {trainingStatus.message || 'Training in progress...'}
                  </p>
                </div>
                <div style={{ fontSize: '24px', color: '#4ecdc4' }}>
                  {getTrainingProgress()}%
                </div>
              </div>

              <div style={styles.progressBar}>
                <div 
                  style={{
                    ...styles.progressFill,
                    width: `${getTrainingProgress()}%`
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Training Results */}
        {result && result.status === 'completed' && (
          <div style={styles.card}>
            <div style={styles.success}>
              <h3 style={{ color: '#4ecdc4', marginBottom: '15px' }}>
                🎉 Training Completed Successfully!
              </h3>
              
              <div style={styles.grid}>
                <div>
                  <p style={{ margin: '8px 0' }}>
                    <strong>Symbol:</strong> {result.symbol}
                  </p>
                  <p style={{ margin: '8px 0' }}>
                    <strong>Training Data Points:</strong> {result.training_data_points?.toLocaleString() || 'N/A'}
                  </p>
                  <p style={{ margin: '8px 0' }}>
                    <strong>Final Loss:</strong> {result.final_loss?.toFixed(6) || 'N/A'}
                  </p>
                </div>
                
                <div>
                  <p style={{ margin: '8px 0' }}>
                    <strong>Training Duration:</strong> {result.training_duration || 'N/A'}
                  </p>
                  <p style={{ margin: '8px 0' }}>
                    <strong>Model Accuracy:</strong> {result.accuracy ? `${(result.accuracy * 100).toFixed(2)}%` : 'N/A'}
                  </p>
                  <p style={{ margin: '8px 0' }}>
                    <strong>Completed:</strong> {new Date().toLocaleString()}
                  </p>
                </div>
              </div>

              <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(0,255,0,0.1)', borderRadius: '8px' }}>
                <p style={{ margin: '0', color: '#4ecdc4' }}>
                  ✅ Your model is now ready for making predictions! 
                  Navigate to the Predictions page to start forecasting stock prices.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Available Models Summary */}
        {models.length > 0 && (
          <div style={styles.card}>
            <h2 style={{ color: '#fff', marginBottom: '20px' }}>📚 Available Models</h2>
            <div style={styles.grid}>
              {models.slice(0, 6).map((model, index) => (
                <div key={index} style={styles.modelInfo}>
                  <h4 style={{ color: '#4ecdc4', margin: '0 0 10px 0' }}>
                    {model.symbol}
                  </h4>
                  <p style={{ color: 'rgba(255,255,255,0.8)', margin: '5px 0', fontSize: '14px' }}>
                    Status: {model.files_present ? '✅ Ready' : '⚠️ Incomplete'}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.6)', margin: '5px 0', fontSize: '12px' }}>
                    Updated: {new Date(model.last_updated).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
            {models.length > 6 && (
              <p style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: '15px' }}>
                ... and {models.length - 6} more models
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Train;