import { useState,useEffect } from "react";
import styles from "../styles";
import { Brain, Settings, Database } from 'lucide-react';

const ModelInfo = () => {
  const [modelInfo, setModelInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchModelInfo();
  }, []);

  const fetchModelInfo = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/model-info`);
      if (!response.ok) throw new Error('Failed to fetch model info');
      const data = await response.json();
      setModelInfo(data);
    } catch (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  if (loading) {
    return <div style={styles.loading}>Loading model information...</div>;
  }

  return (
    <div>
      <h1 style={{fontSize: '32px', marginBottom: '30px'}}>Model Information</h1>
      
      {error ? (
        <div style={styles.error}>
          <h3>No Model Loaded</h3>
          <p>Please train a model first to view model information.</p>
        </div>
      ) : (
        <div style={styles.card}>
          <h2>Current Model Details</h2>
          
          <div style={styles.grid}>
            <div style={styles.statusCard}>
              <div>
                <h3>Model Status</h3>
                <p>{modelInfo?.model_loaded ? 'Loaded' : 'Not Loaded'}</p>
              </div>
              <Brain size={32} />
            </div>
            
            <div style={styles.statusCard}>
              <div>
                <h3>Scaler Status</h3>
                <p>{modelInfo?.scaler_loaded ? 'Loaded' : 'Not Loaded'}</p>
              </div>
              <Settings size={32} />
            </div>
            
            <div style={styles.statusCard}>
              <div>
                <h3>Model Layers</h3>
                <p>{modelInfo?.model_layers || 'N/A'}</p>
              </div>
              <Database size={32} />
            </div>
          </div>
          
          {modelInfo?.input_shape && (
            <div style={{marginTop: '30px'}}>
              <h3>Technical Details</h3>
              <p><strong>Input Shape:</strong> {JSON.stringify(modelInfo.input_shape)}</p>
              <p><strong>Output Shape:</strong> {JSON.stringify(modelInfo.output_shape)}</p>
              <p><strong>Total Layers:</strong> {modelInfo.model_layers}</p>
            </div>
          )}
        </div>
      )}
      
      <div style={styles.card}>
        <h2>Model Architecture</h2>
        <p>The LSTM model uses the following architecture:</p>
        <ul style={{listStyle: 'none', padding: 0}}>
          <li style={{padding: '10px 0'}}>🔹 LSTM Layer (50 units, return_sequences=True)</li>
          <li style={{padding: '10px 0'}}>🔹 LSTM Layer (50 units)</li>
          <li style={{padding: '10px 0'}}>🔹 Dense Layer (1 unit)</li>
          <li style={{padding: '10px 0'}}>🔹 Optimizer: Adam</li>
          <li style={{padding: '10px 0'}}>🔹 Loss Function: Mean Squared Error</li>
          <li style={{padding: '10px 0'}}>🔹 Window Size: 60 time steps</li>
        </ul>
      </div>
    </div>
  );
};
export default ModelInfo;