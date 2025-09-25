import React from 'react';

export default function HomeScreen({ progress, stats, config, onStartQuiz, onShowStats, onShowDetailedStats, onShowSettings }) {
  const totalQuestions = 1512;
  const studiedQuestions = Object.keys(progress).filter(key => key.startsWith('q:')).length;
  
  const calculateSuccessRate = () => {
    let totalApariciones = 0;
    let totalAciertos = 0;
    
    Object.values(progress).forEach(data => {
      if (data.apariciones) {
        totalApariciones += data.apariciones;
        totalAciertos += data.aciertos || 0;
      }
    });
    
    return totalApariciones > 0 ? Math.round((totalAciertos / totalApariciones) * 100) : 0;
  };
  
  const successRate = calculateSuccessRate();
  
  return (
    <div className="container fade-in">
      <div className="home-screen">
        <h1>OPE Medicina Preventiva</h1>
        
        <div className="stats-summary">
          <h2>Tu Progreso</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{studiedQuestions}</div>
              <div className="stat-label">Preguntas estudiadas</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{totalQuestions}</div>
              <div className="stat-label">Total preguntas</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{successRate}%</div>
              <div className="stat-label">Tasa de acierto</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.total_tests || 0}</div>
              <div className="stat-label">Tests realizados</div>
            </div>
          </div>
        </div>
        
        <button className="btn btn-primary" onClick={onStartQuiz}>
          Comenzar Test ({config?.questions_per_test || 100} preguntas)
        </button>
        
        <button className="btn btn-secondary" onClick={onShowStats}>
          Ver Historial de Tests
        </button>
        
        <button className="btn btn-secondary" onClick={onShowDetailedStats}>
          Ver Estadísticas Detalladas
        </button>
        
        <button className="btn btn-secondary" onClick={onShowSettings}>
          Configuración
        </button>
      </div>
    </div>
  );
}