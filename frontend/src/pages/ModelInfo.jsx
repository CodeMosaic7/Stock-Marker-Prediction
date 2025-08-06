import { useState, useEffect, useCallback } from "react";
import styles from "../styles";
import { Brain, Settings, Database, RefreshCw, AlertCircle, CheckCircle, Activity, Layers, TrendingUp } from 'lucide-react';
import { getAvailableModels, getDetailedHealth, formatErrorMessage } from '../api/api';

const ModelInfo = () => {
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [systemHealth, setSystemHealth] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setError('');
      
      
      const [modelsResult, healthResult] = await Promise.all([
        getAvailableModels(),
        getDetailedHealth()
      ]);

      if (modelsResult.success) {
        const availableModels = modelsResult.data.models || [];
        setModels(availableModels);
        
        // Auto-select first healthy model if none selected
        if (!selectedModel && availableModels.length > 0) {
          const healthyModel = availableModels.find(m => m.files_present) || availableModels[0];
          setSelectedModel(healthyModel);
        }
      } else {
        setError(modelsResult.error || 'Failed to fetch models');
      }

      if (healthResult.success) {
        setSystemHealth(healthResult.data);
      }

    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedModel]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  const handleModelSelect = (model) => {
    setSelectedModel(model);
  };

  const getModelStatusIcon = (model) => {
    if (!model.files_present) return <AlertCircle size={20} color="#ef4444" />;
    if (model.last_trained) return <CheckCircle size={20} color="#10b981" />;
    return <Activity size={20} color="#f59e0b" />;
  };

  const getModelStatusText = (model) => {
    if (!model.files_present) return 'Missing Files';
    if (model.last_trained) return 'Ready';
    return 'Unknown Status';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const formatFileSize = (sizeInBytes) => {
    if (!sizeInBytes) return 'N/A';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = sizeInBytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <Activity size={32} />
        <p>Loading model information...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', margin: 0 }}>Model Information</h1>
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            ...styles.primaryButton,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error ? (
        <div style={styles.error}>
          <AlertCircle size={24} />
          <div>
            <h3>Unable to Load Model Information</h3>
            <p>{error}</p>
            <p>Please ensure the API server is running and try refreshing.</p>
          </div>
        </div>
      ) : models.length === 0 ? (
        <div style={styles.error}>
          <Brain size={48} />
          <div>
            <h3>No Models Found</h3>
            <p>No trained models are available. Please train a model first to view model information.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Model Selection */}
          <div style={styles.card}>
            <h2>Available Models ({models.length})</h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
              gap: '15px',
              marginTop: '20px'
            }}>
              {models.map((model, index) => (
                <div
                  key={model.symbol || index}
                  onClick={() => handleModelSelect(model)}
                  style={{
                    ...styles.statusCard,
                    cursor: 'pointer',
                    border: selectedModel?.symbol === model.symbol ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    backgroundColor: selectedModel?.symbol === model.symbol ? '#eff6ff' : '#ffffff'
                  }}
                >
                  <div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>{model.symbol}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {getModelStatusIcon(model)}
                      <span style={{ fontSize: '14px' }}>{getModelStatusText(model)}</span>
                    </div>
                  </div>
                  <TrendingUp size={24} />
                </div>
              ))}
            </div>
          </div>

          {/* Selected Model Details */}
          {selectedModel && (
            <div style={styles.card}>
              <h2>Model Details - {selectedModel.symbol}</h2>
              <div style={styles.grid}>
                <div style={styles.statusCard}>
                  <div>
                    <h3>Model Status</h3>
                    <p>{selectedModel.files_present ? 'Files Present' : 'Missing Files'}</p>
                  </div>
                  <Brain size={32} color={selectedModel.files_present ? '#10b981' : '#ef4444'} />
                </div>

                <div style={styles.statusCard}>
                  <div>
                    <h3>Last Trained</h3>
                    <p>{formatDate(selectedModel.last_trained)}</p>
                  </div>
                  <Settings size={32} />
                </div>

                <div style={styles.statusCard}>
                  <div>
                    <h3>Model Size</h3>
                    <p>{formatFileSize(selectedModel.model_size)}</p>
                  </div>
                  <Database size={32} />
                </div>
              </div>

              {/* Technical Details */}
              <div style={{ marginTop: '30px' }}>
                <h3>Technical Details</h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                  gap: '20px',
                  marginTop: '15px'
                }}>
                  <div>
                    <p><strong>Symbol:</strong> {selectedModel.symbol}</p>
                    <p><strong>Created:</strong> {formatDate(selectedModel.created_at)}</p>
                    <p><strong>Last Modified:</strong> {formatDate(selectedModel.last_modified)}</p>
                  </div>
                  <div>
                    <p><strong>Model File:</strong> {selectedModel.model_file || 'N/A'}</p>
                    <p><strong>Scaler File:</strong> {selectedModel.scaler_file || 'N/A'}</p>
                    <p><strong>Features File:</strong> {selectedModel.features_file || 'N/A'}</p>
                  </div>
                </div>

                {/* Training Configuration */}
                {selectedModel.training_config && (
                  <div style={{ marginTop: '20px' }}>
                    <h4>Training Configuration</h4>
                    <div style={{ 
                      backgroundColor: '#f8f9fa', 
                      padding: '15px', 
                      borderRadius: '8px',
                      marginTop: '10px'
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                        <p><strong>Sequence Length:</strong> {selectedModel.training_config.sequence_length || 'N/A'}</p>
                        <p><strong>Prediction Horizon:</strong> {selectedModel.training_config.prediction_horizon || 'N/A'}</p>
                        <p><strong>Epochs:</strong> {selectedModel.training_config.epochs || 'N/A'}</p>
                        <p><strong>Interval:</strong> {selectedModel.training_config.interval || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Model Metrics */}
                {selectedModel.metrics && (
                  <div style={{ marginTop: '20px' }}>
                    <h4>Model Performance</h4>
                    <div style={{ 
                      backgroundColor: '#f0f9ff', 
                      padding: '15px', 
                      borderRadius: '8px',
                      marginTop: '10px'
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                        {Object.entries(selectedModel.metrics).map(([key, value]) => (
                          <p key={key}>
                            <strong>{key.replace('_', ' ').toUpperCase()}:</strong> {
                              typeof value === 'number' ? value.toFixed(4) : value
                            }
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* System Health */}
          {systemHealth && (
            <div style={styles.card}>
              <h2>System Health</h2>
              <div style={styles.grid}>
                <div style={styles.statusCard}>
                  <div>
                    <h3>API Status</h3>
                    <p>{systemHealth.status || 'Unknown'}</p>
                  </div>
                  <Activity size={32} color={systemHealth.status === 'healthy' ? '#10b981' : '#ef4444'} />
                </div>

                <div style={styles.statusCard}>
                  <div>
                    <h3>Active Trainings</h3>
                    <p>{systemHealth.active_trainings || 0}</p>
                  </div>
                  <Brain size={32} />
                </div>

                <div style={styles.statusCard}>
                  <div>
                    <h3>Memory Usage</h3>
                    <p>{systemHealth.memory_usage ? `${(systemHealth.memory_usage * 100).toFixed(1)}%` : 'N/A'}</p>
                  </div>
                  <Database size={32} />
                </div>
              </div>
            </div>
          )}

          {/* Model Architecture Information */}
          <div style={styles.card}>
            <h2>
              <Layers size={24} style={{ marginRight: '10px', verticalAlign: 'middle' }} />
              LSTM Model Architecture
            </h2>
            <p style={{ marginBottom: '20px', color: '#6b7280' }}>
              Standard architecture used for all stock prediction models:
            </p>
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '20px', 
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ padding: '12px 0', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center' }}>
                  <span style={{ marginRight: '10px' }}>🔹</span>
                  <strong>Input Layer:</strong> &nbsp; Time series data with configurable sequence length
                </li>
                <li style={{ padding: '12px 0', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center' }}>
                  <span style={{ marginRight: '10px' }}>🔹</span>
                  <strong>LSTM Layer 1:</strong> &nbsp; 50 units, return_sequences=True
                </li>
                <li style={{ padding: '12px 0', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center' }}>
                  <span style={{ marginRight: '10px' }}>🔹</span>
                  <strong>LSTM Layer 2:</strong> &nbsp; 50 units, return_sequences=False
                </li>
                <li style={{ padding: '12px 0', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center' }}>
                  <span style={{ marginRight: '10px' }}>🔹</span>
                  <strong>Dense Layer:</strong> &nbsp; 1 unit (price prediction output)
                </li>
                <li style={{ padding: '12px 0', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center' }}>
                  <span style={{ marginRight: '10px' }}>⚙️</span>
                  <strong>Optimizer:</strong> &nbsp; Adam with default learning rate
                </li>
                <li style={{ padding: '12px 0', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center' }}>
                  <span style={{ marginRight: '10px' }}>📊</span>
                  <strong>Loss Function:</strong> &nbsp; Mean Squared Error (MSE)
                </li>
                <li style={{ padding: '12px 0', display: 'flex', alignItems: 'center' }}>
                  <span style={{ marginRight: '10px' }}>🎯</span>
                  <strong>Default Window:</strong> &nbsp; 60 time steps (configurable during training)
                </li>
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ModelInfo;