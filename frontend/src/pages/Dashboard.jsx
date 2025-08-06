import { useState, useEffect, useCallback } from "react";
import { 
  Activity, 
  Brain, 
  Settings, 
  Database, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  TrendingUp, 
  Clock, 
  Server,
  BarChart3,
  Zap,
  Users,
  Calendar,
  Target,
  LineChart
} from 'lucide-react';
import styles from '../styles';
import { getDashboardData, formatErrorMessage} from '../api/api.js';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchDashboardData = useCallback(async (forceRefresh = false) => {
    try {
      setError('');
      if (forceRefresh) setRefreshing(true);
      
      const result = await getDashboardData();
      
      if (result.success) {
        setDashboardData(result.data);
        setLastUpdated(new Date().toLocaleString());
      } else {
        setError(result.message || 'Failed to load dashboard data');
      }
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getModelStatusCounts = () => {
    if (!dashboardData?.models) return { total: 0, healthy: 0, training: 0, failed: 0 };
    
    const models = dashboardData.models;
    return {
      total: models.length,
      healthy: models.filter(m => m.files_present).length,
      training: dashboardData.health?.active_trainings || 0,
      failed: models.filter(m => !m.files_present).length
    };
  };

  const getRecentActivity = () => {
    if (!dashboardData?.models) return [];
    
    return dashboardData.models
      .filter(m => m.last_updated)
      .sort((a, b) => new Date(b.last_updated) - new Date(a.last_updated))
      .slice(0, 5);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px' }}>
        <div style={styles.loading}>
          <Activity size={48} style={{ color: '#4ecdc4', animation: 'pulse 2s infinite' }} />
          <p style={{ marginTop: '16px', fontSize: '18px' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const modelCounts = getModelStatusCounts();
  const recentActivity = getRecentActivity();

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '30px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h1 style={{
              fontSize: '40px', 
              margin: 0, 
              color: '#fff',
              fontWeight: 'bold',
              textShadow: '0 4px 8px rgba(0,0,0,0.3)'
            }}>
              📊 Stock Prediction Dashboard
            </h1>
            {lastUpdated && (
              <p style={{ 
                margin: '8px 0 0 0', 
                color: 'rgba(255,255,255,0.8)', 
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Clock size={14} />
                Last updated: {lastUpdated}
              </p>
            )}
          </div>
          
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              ...styles.primaryButton,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              minWidth: '120px',
              opacity: refreshing ? 0.7 : 1
            }}
          >
            <RefreshCw 
              size={16} 
              style={{ 
                animation: refreshing ? 'spin 1s linear infinite' : 'none',
                transformOrigin: 'center'
              }} 
            />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div style={{ ...styles.error, marginBottom: '24px' }}>
            <AlertCircle size={24} />
            <div>
              <h3 style={{ margin: '0 0 4px 0' }}>Dashboard Error</h3>
              <p style={{ margin: 0 }}>{error}</p>
            </div>
          </div>
        )}

        {/* System Status Cards */}
        <div style={styles.grid}>
          <div style={{
            ...styles.statusCard, 
            ...(dashboardData?.summary?.apiHealthy ? styles.statusGreen : styles.statusRed)
          }}>
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>System Status</h3>
              <p style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: 'bold' }}>
                {dashboardData?.summary?.apiHealthy ? 'Healthy' : 'Down'}
              </p>
              <small style={{ opacity: 0.9, fontSize: '12px' }}>
                {dashboardData?.health?.uptime ? 
                  `Uptime: ${Math.floor(dashboardData.health.uptime / 3600)}h` : 
                  'System monitoring active'
                }
              </small>
            </div>
            <Activity size={32} style={{ opacity: 0.8 }} />
          </div>

          <div style={{
            ...styles.statusCard,
            ...(modelCounts.total > 0 ? styles.statusGreen : styles.statusRed)
          }}>
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Total Models</h3>
              <p style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: 'bold' }}>
                {modelCounts.total}
              </p>
              <small style={{ opacity: 0.9, fontSize: '12px' }}>
                {modelCounts.healthy} ready, {modelCounts.failed} incomplete
              </small>
            </div>
            <Brain size={32} style={{ opacity: 0.8 }} />
          </div>

          <div style={{
            ...styles.statusCard,
            ...(modelCounts.training === 0 ? styles.statusGreen : styles.statusBlue)
          }}>
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Active Training</h3>
              <p style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: 'bold' }}>
                {modelCounts.training}
              </p>
              <small style={{ opacity: 0.9, fontSize: '12px' }}>
                {modelCounts.training > 0 ? 'Training in progress' : 'System idle'}
              </small>
            </div>
            <Settings size={32} style={{ opacity: 0.8 }} />
          </div>

          <div style={{
            ...styles.statusCard,
            ...styles.statusGreen
          }}>
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>API Connection</h3>
              <p style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: 'bold' }}>
                Connected
              </p>
              <small style={{ opacity: 0.9, fontSize: '12px' }}>
                {dashboardData?.health?.response_time ? 
                  `${dashboardData.health.response_time}ms response` : 
                  'Real-time data'
                }
              </small>
            </div>
            <Database size={32} style={{ opacity: 0.8 }} />
          </div>
        </div>

        {/* Quick Stats */}
        <div style={styles.card}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '25px', color: '#fff' }}>
            <BarChart3 size={24} />
            Quick Statistics
          </h2>
          <div style={styles.statGrid}>
            <div style={styles.statItem}>
              <Target size={32} style={{ color: '#4ecdc4', marginBottom: '12px' }} />
              <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#4ecdc4' }}>
                {modelCounts.healthy}
              </h3>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>Ready Models</p>
            </div>
            
            <div style={styles.statItem}>
              <Zap size={32} style={{ color: '#ffc107', marginBottom: '12px' }} />
              <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#ffc107' }}>
                {modelCounts.training}
              </h3>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>Training</p>
            </div>
            
            <div style={styles.statItem}>
              <AlertCircle size={32} style={{ color: '#ef4444', marginBottom: '12px' }} />
              <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#ef4444' }}>
                {modelCounts.failed}
              </h3>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>Incomplete</p>
            </div>
            
            <div style={styles.statItem}>
              <Server size={32} style={{ color: '#10b981', marginBottom: '12px' }} />
              <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#10b981' }}>
                {dashboardData?.health?.memory_usage ? 
                  `${(dashboardData.health.memory_usage * 100).toFixed(1)}%` : '< 50%'}
              </h3>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>Memory Usage</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <div style={styles.card}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '25px', color: '#fff' }}>
              <Calendar size={24} />
              Recent Model Activity
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentActivity.map((model, index) => (
                <div key={model.symbol || index} style={styles.activityItem}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {model.files_present ? 
                      <CheckCircle size={20} color="#4ecdc4" /> : 
                      <AlertCircle size={20} color="#ef4444" />
                    }
                    <div>
                      <h4 style={{ margin: 0, fontSize: '16px', color: '#fff' }}>{model.symbol}</h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
                        Last updated: {formatDate(model.last_updated)}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: model.files_present ? 'rgba(78, 205, 196, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: model.files_present ? '#4ecdc4' : '#ef4444',
                      border: `1px solid ${model.files_present ? 'rgba(78, 205, 196, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                    }}>
                      {model.files_present ? 'Ready' : 'Incomplete'}
                    </span>
                    <TrendingUp size={16} color="rgba(255,255,255,0.6)" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Welcome Section */}
        <div style={styles.card}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', color: '#fff' }}>
            <LineChart size={24} />
            Welcome to StockAI Platform
          </h2>
          <p style={{ marginBottom: '25px', color: 'rgba(255,255,255,0.8)', fontSize: '16px' }}>
            Your AI-powered stock prediction platform. Get started with these key features:
          </p>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '20px' 
          }}>
            <div style={{...styles.featureCard, borderLeft: '4px solid #0284c7'}}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <BarChart3 size={24} color="#4ecdc4" />
                <h3 style={{ margin: 0, color: '#4ecdc4' }}>Real-Time Data</h3>
              </div>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
                View live stock data with multiple timeframes and technical indicators for comprehensive analysis.
              </p>
            </div>

            <div style={{...styles.featureCard, borderLeft: '4px solid #16a34a'}}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <Brain size={24} color="#4ecdc4" />
                <h3 style={{ margin: 0, color: '#4ecdc4' }}>ML Training</h3>
              </div>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
                Train advanced LSTM models with customizable parameters and real-time monitoring capabilities.
              </p>
            </div>

            <div style={{...styles.featureCard, borderLeft: '4px solid #ca8a04'}}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <TrendingUp size={24} color="#4ecdc4" />
                <h3 style={{ margin: 0, color: '#4ecdc4' }}>Predictions</h3>
              </div>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
                Generate accurate price predictions with confidence intervals and comprehensive statistical analysis.
              </p>
            </div>

            <div style={{...styles.featureCard, borderLeft: '4px solid #9333ea'}}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <Activity size={24} color="#4ecdc4" />
                <h3 style={{ margin: 0, color: '#4ecdc4' }}>Monitoring</h3>
              </div>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
                Track model performance, system health, and prediction accuracy with real-time dashboards.
              </p>
            </div>
          </div>
        </div>

        {/* System Information */}
        {dashboardData?.health && (
          <div style={styles.card}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '25px', color: '#fff' }}>
              <Server size={24} />
              System Information
            </h2>
            <div style={styles.systemGrid}>
              <div style={styles.statItem}>
                <h4 style={{ color: '#4ecdc4', marginBottom: '12px' }}>API Details</h4>
                <p style={{ color: 'rgba(255,255,255,0.8)', margin: '4px 0' }}>
                  <strong>Version:</strong> {dashboardData.health.version || '1.0.0'}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.8)', margin: '4px 0' }}>
                  <strong>Status:</strong> {dashboardData.health.status || 'Healthy'}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.8)', margin: '4px 0' }}>
                  <strong>Uptime:</strong> {
                    dashboardData.health.uptime ? 
                    `${Math.floor(dashboardData.health.uptime / 3600)}h ${Math.floor((dashboardData.health.uptime % 3600) / 60)}m` : 
                    'N/A'
                  }
                </p>
              </div>
              
              <div style={styles.statItem}>
                <h4 style={{ color: '#4ecdc4', marginBottom: '12px' }}>Model Statistics</h4>
                <p style={{ color: 'rgba(255,255,255,0.8)', margin: '4px 0' }}>
                  <strong>Active Trainings:</strong> {modelCounts.training}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.8)', margin: '4px 0' }}>
                  <strong>Total Models:</strong> {modelCounts.total}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.8)', margin: '4px 0' }}>
                  <strong>Ready Models:</strong> {modelCounts.healthy}
                </p>
              </div>
              
              <div style={styles.statItem}>
                <h4 style={{ color: '#4ecdc4', marginBottom: '12px' }}>Performance</h4>
                <p style={{ color: 'rgba(255,255,255,0.8)', margin: '4px 0' }}>
                  <strong>Response Time:</strong> {dashboardData.health.response_time || '<50'}ms
                </p>
                <p style={{ color: 'rgba(255,255,255,0.8)', margin: '4px 0' }}>
                  <strong>Memory Usage:</strong> {
                    dashboardData.health.memory_usage ? 
                    `${(dashboardData.health.memory_usage * 100).toFixed(1)}%` : 
                    '< 50%'
                  }
                </p>
                <p style={{ color: 'rgba(255,255,255,0.8)', margin: '4px 0' }}>
                  <strong>Last Check:</strong> {formatDate(new Date().toISOString())}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;