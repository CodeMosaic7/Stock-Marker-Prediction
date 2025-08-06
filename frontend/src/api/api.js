// api/api.js
import apiClient from './config';


export const getApiHealth = async () => {
  try {
    const response = await apiClient.get('/');
    return response.data;
  } catch (error) {
    throw error;
  }
};


export const getDetailedHealth = async () => {
  try {
    const response = await apiClient.get('/health');
    return response.data;
  } catch (error) {
    throw error;
  }
};



// Get stock data for a symbol
export const getStockData = async (symbol, interval = '5min', limit = 100) => {
  try {
    const response = await apiClient.get(`/stock-data/${symbol.toUpperCase()}`, {
      params: { interval, limit }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};



// Start model training
export const startTraining = async (trainingRequest) => {
  try {
    const response = await apiClient.post('/train', {
      symbol: trainingRequest.symbol.toUpperCase(),
      interval: trainingRequest.interval || '5min',
      sequence_length: trainingRequest.sequence_length || 60,
      prediction_horizon: trainingRequest.prediction_horizon || 1,
      epochs: trainingRequest.epochs || 50
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get training status
export const getTrainingStatus = async (symbol) => {
  try {
    const response = await apiClient.get(`/training-status/${symbol.toUpperCase()}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Poll training status (helper function for continuous monitoring)
export const pollTrainingStatus = async (symbol, onUpdate, intervalMs = 2000) => {
  const poll = async () => {
    try {
      const status = await getTrainingStatus(symbol);
      onUpdate(status);
      
      if (status.status === 'training') {
        setTimeout(poll, intervalMs);
      }
    } catch (error) {
      onUpdate({ status: 'error', message: error.message });
    }
  };
  
  poll();
};



// Make price predictions
export const predictPrices = async (predictionRequest) => {
  try {
    const response = await apiClient.post('/predict', {
      symbol: predictionRequest.symbol.toUpperCase(),
      steps: predictionRequest.steps || 10,
      use_latest_data: predictionRequest.use_latest_data !== false // default true
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};



// List available models
export const getAvailableModels = async () => {
  try {
    const response = await apiClient.get('/models');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete a model
export const deleteModel = async (symbol) => {
  try {
    const response = await apiClient.delete(`/models/${symbol.toUpperCase()}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};


// Format error message for display
export const formatErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  if (error.detail) return error.detail;
  return 'An unexpected error occurred';
};

// Check if model exists for symbol
export const checkModelExists = async (symbol) => {
  try {
    const models = await getAvailableModels();
    return models.models.some(model => 
      model.symbol.toUpperCase() === symbol.toUpperCase() && 
      model.files_present
    );
  } catch (error) {
    return false;
  }
};

// Get model info for symbol
export const getModelInfo = async (symbol) => {
  try {
    const models = await getAvailableModels();
    return models.models.find(model => 
      model.symbol.toUpperCase() === symbol.toUpperCase()
    );
  } catch (error) {
    return null;
  }
};


// Complete training workflow
export const trainModelWorkflow = async (symbol, options = {}) => {
  const trainingConfig = {
    symbol,
    interval: options.interval || '5min',
    sequence_length: options.sequence_length || 60,
    prediction_horizon: options.prediction_horizon || 1,
    epochs: options.epochs || 50
  };
  
  try {
    // Start training
    const trainingResponse = await startTraining(trainingConfig);
    
    return {
      success: true,
      message: trainingResponse.message,
      symbol: trainingResponse.symbol,
      statusUrl: trainingResponse.check_status_url
    };
  } catch (error) {
    return {
      success: false,
      message: formatErrorMessage(error),
      error
    };
  }
};

// Complete prediction workflow
export const predictPricesWorkflow = async (symbol, options = {}) => {
  try {
    // Check if model exists
    const modelExists = await checkModelExists(symbol);
    if (!modelExists) {
      throw new Error(`No trained model found for ${symbol}. Please train a model first.`);
    }
    
    // Make prediction
    const prediction = await predictPrices({
      symbol,
      steps: options.steps || 10,
      use_latest_data: options.use_latest_data !== false
    });
    
    return {
      success: true,
      data: prediction
    };
  } catch (error) {
    return {
      success: false,
      message: formatErrorMessage(error),
      error
    };
  }
};

// Get comprehensive dashboard data
export const getDashboardData = async () => {
  try {
    const [health, models] = await Promise.all([
      getDetailedHealth(),
      getAvailableModels()
    ]);
    
    return {
      success: true,
      data: {
        health,
        models: models.models,
        summary: {
          totalModels: models.models.length,
          healthyModels: models.models.filter(m => m.files_present).length,
          apiHealthy: health.status === 'healthy',
          activeTrainings: health.active_trainings || 0
        }
      }
    };
  } catch (error) {
    return {
      success: false,
      message: formatErrorMessage(error),
      error
    };
  }
};



// Custom hook for API state management
export const createApiHook = (apiFunction) => {
  return () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const execute = async (...args) => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await apiFunction(...args);
        setData(result);
        return result;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    };
    
    return { data, loading, error, execute };
  };
};

// Export individual hooks for common operations
export const useStockData = createApiHook(getStockData);
export const useTraining = createApiHook(startTraining);
export const usePrediction = createApiHook(predictPrices);
export const useModels = createApiHook(getAvailableModels);


export const createWebSocketConnection = (url, onMessage, onError) => {
  const ws = new WebSocket(url);
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error('WebSocket message parsing error:', error);
    }
  };
  
  ws.onerror = (error) => {
    if (onError) onError(error);
  };
  
  return {
    close: () => ws.close(),
    send: (data) => ws.send(JSON.stringify(data))
  };
};


export default {
  // Health
  getApiHealth,
  getDetailedHealth,
  
  // Stock Data
  getStockData,
  
  // Training
  startTraining,
  getTrainingStatus,
  pollTrainingStatus,
  
  // Prediction
  predictPrices,
  
  // Models
  getAvailableModels,
  deleteModel,
  
  // Utilities
  formatErrorMessage,
  checkModelExists,
  getModelInfo,
  
  // Workflows
  trainModelWorkflow,
  predictPricesWorkflow,
  getDashboardData,
  
  // WebSocket
  createWebSocketConnection
};