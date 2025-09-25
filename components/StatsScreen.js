import React, { useState, useEffect } from 'react';
import { QuizStorage } from '../lib/kv-client';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const storage = new QuizStorage();

export default function StatsScreen({ onBack }) {
  const [stats, setStats] = useState({});
  const [progress, setProgress] = useState({});
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  useEffect(() => {
    loadAllData();
  }, []);
  
  const loadAllData = async () => {
    try {
      const [userStats, userProgress, testHistory] = await Promise.all([
        storage.getUserStats(),
        storage.getUserProgress(),
        storage.getTestHistory(30)
      ]);
      
      setStats(userStats);
      setProgress(userProgress);
      setHistory(testHistory);
      setLoading(false);
    } catch (error) {
      console.error('Error loading stats:', error);
      setLoading(false);
    }
  };
  
  const calculateCategoryStats = () => {
    const categoryData = {};
    const categoryNames = {
      'examenes_navarra_pais_vasco': 'Exámenes Navarra y País Vasco',
      'mir_medicina_preventiva': 'MIR Medicina Preventiva',
      'renave_declaracion': 'Protocolos RENAVE',
      'leyes': 'Leyes',
      'plan_salud_navarra': 'Plan de Salud Navarra',
      'otros': 'Otros'
    };
    
    Object.entries(progress).forEach(([key, data]) => {
      if (key.startsWith('q:') && data.apariciones > 0) {
        // Necesitaríamos la categoría de cada pregunta
        // Por ahora, simularemos con datos de ejemplo
        const category = 'otros'; // Esto debería venir de la pregunta
        
        if (!categoryData[category]) {
          categoryData[category] = {
            name: categoryNames[category] || category,
            apariciones: 0,
            aciertos: 0,
            preguntas: 0
          };
        }
        
        categoryData[category].apariciones += data.apariciones;
        categoryData[category].aciertos += data.aciertos || 0;
        categoryData[category].preguntas += 1;
      }
    });
    
    return Object.values(categoryData).map(cat => ({
      ...cat,
      tasaAcierto: cat.apariciones > 0 ? Math.round((cat.aciertos / cat.apariciones) * 100) : 0
    }));
  };
  
  const getProgressChartData = () => {
    return history
      .slice(0, 10)
      .reverse()
      .map((test, index) => ({
        test: `Test ${index + 1}`,
        puntuacion: test.score,
        fecha: new Date(test.end_time || test.start_time).toLocaleDateString('es-ES')
      }));
  };
  
  const getTimeDistributionData = () => {
    const timeRanges = {
      '0-30 min': 0,
      '30-60 min': 0,
      '60-90 min': 0,
      '90-120 min': 0,
      '+120 min': 0
    };
    
    history.forEach(test => {
      const duration = test.duration || 0;
      if (duration <= 30) timeRanges['0-30 min']++;
      else if (duration <= 60) timeRanges['30-60 min']++;
      else if (duration <= 90) timeRanges['60-90 min']++;
      else if (duration <= 120) timeRanges['90-120 min']++;
      else timeRanges['+120 min']++;
    });
    
    return Object.entries(timeRanges).map(([range, count]) => ({
      range,
      count
    }));
  };
  
  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando estadísticas...</p>
      </div>
    );
  }
  
  return (
    <div className="stats-screen fade-in">
      <div className="stats-header">
        <button className="btn-back" onClick={onBack}>
          ← Volver
        </button>
        <h2>Estadísticas Detalladas</h2>
      </div>
      
      <div className="stats-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Resumen
        </button>
        <button 
          className={`tab-button ${activeTab === 'progress' ? 'active' : ''}`}
          onClick={() => setActiveTab('progress')}
        >
          Progreso
        </button>
        <button 
          className={`tab-button ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          Categorías
        </button>
        <button 
          className={`tab-button ${activeTab === 'time' ? 'active' : ''}`}
          onClick={() => setActiveTab('time')}
        >
          Tiempo
        </button>
      </div>
      
      <div className="stats-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="stats-grid-large">
              <div className="stat-card-large">
                <div className="stat-icon">📊</div>
                <div className="stat-value-large">{stats.total_tests || 0}</div>
                <div className="stat-label-large">Tests Realizados</div>
              </div>
              
              <div className="stat-card-large">
                <div className="stat-icon">🎯</div>
                <div className="stat-value-large">{Math.round(stats.average_score || 0)}%</div>
                <div className="stat-label-large">Puntuación Media</div>
              </div>
              
              <div className="stat-card-large">
                <div className="stat-icon">📚</div>
                <div className="stat-value-large">
                  {Object.keys(progress).filter(k => k.startsWith('q:')).length}
                </div>
                <div className="stat-label-large">Preguntas Estudiadas</div>
              </div>
              
              <div className="stat-card-large">
                <div className="stat-icon">⏱️</div>
                <div className="stat-value-large">
                  {history.length > 0 ? Math.round(history.reduce((sum, t) => sum + (t.duration || 0), 0) / history.length) : 0} min
                </div>
                <div className="stat-label-large">Tiempo Medio por Test</div>
              </div>
            </div>
            
            {stats.last_test && (
              <div className="last-test-info">
                <h3>Último test realizado</h3>
                <p>{new Date(stats.last_test).toLocaleString('es-ES')}</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'progress' && (
          <div className="progress-tab">
            <h3>Evolución de Puntuaciones</h3>
            {history.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getProgressChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="test" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload[0]) {
                        return (
                          <div className="custom-tooltip">
                            <p>{`Puntuación: ${payload[0].value}%`}</p>
                            <p>{`Fecha: ${payload[0].payload.fecha}`}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="puntuacion" 
                    stroke="#2563eb" 
                    strokeWidth={2}
                    name="Puntuación"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="no-data">No hay datos de progreso disponibles</p>
            )}
          </div>
        )}
        
        {activeTab === 'categories' && (
          <div className="categories-tab">
            <h3>Rendimiento por Categorías</h3>
            <div className="category-stats">
              {calculateCategoryStats().map((cat, index) => (
                <div key={index} className="category-card">
                  <h4>{cat.name}</h4>
                  <div className="category-metrics">
                    <div className="metric">
                      <span className="metric-label">Preguntas vistas</span>
                      <span className="metric-value">{cat.preguntas}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Intentos totales</span>
                      <span className="metric-value">{cat.apariciones}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Tasa de acierto</span>
                      <span className="metric-value" style={{ color: cat.tasaAcierto >= 70 ? '#10b981' : '#ef4444' }}>
                        {cat.tasaAcierto}%
                      </span>
                    </div>
                  </div>
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar-fill" 
                      style={{ 
                        width: `${cat.tasaAcierto}%`,
                        backgroundColor: cat.tasaAcierto >= 70 ? '#10b981' : cat.tasaAcierto >= 50 ? '#f59e0b' : '#ef4444'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'time' && (
          <div className="time-tab">
            <h3>Distribución de Tiempos</h3>
            {history.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getTimeDistributionData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563eb" name="Número de tests" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="no-data">No hay datos de tiempo disponibles</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}