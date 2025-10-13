import React, { useState, useEffect } from 'react';

export default function HistoryScreen({ onBack }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState(null);
  
  useEffect(() => {
    loadHistory();
  }, []);
  
  const loadHistory = async () => {
    try {
      const response = await fetch('/api/history?limit=50');
      if (!response.ok) {
        throw new Error('Failed to load history');
      }
      const data = await response.json();
      setHistory(data.history || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading history:', error);
      setLoading(false);
    }
  };
  
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };
  
  const exportToCSV = () => {
    const headers = ['Fecha', 'Puntuación', 'Aciertos', 'Total', 'Duración (min)'];
    const rows = history.map(test => [
      formatDate(test.end_time || test.start_time),
      test.score,
      test.correct,
      test.total,
      test.duration || 0
    ]);
    
    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.join(',') + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `historial_tests_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando historial...</p>
      </div>
    );
  }
  
  return (
    <div className="history-screen fade-in">
      <div className="history-header">
        <button className="btn-back" onClick={onBack}>
          ← Volver
        </button>
        <h2>Historial de Tests</h2>
        <div className="history-stats">
          <span>{history.length} tests realizados</span>
          {history.length > 0 && (
            <button className="btn-export" onClick={exportToCSV}>
              📥 Exportar CSV
            </button>
          )}
        </div>
      </div>
      
      {history.length === 0 ? (
        <div className="empty-history">
          <p>No has realizado ningún test todavía.</p>
          <p>¡Comienza tu primer test para ver tu progreso aquí!</p>
        </div>
      ) : (
        <div className="history-list">
          {history.map((test, index) => (
            <div 
              key={test.id} 
              className="history-item"
              onClick={() => setSelectedTest(test)}
            >
              <div className="history-item-header">
                <span className="test-number">Test #{history.length - index}</span>
                <span className="test-date">{formatDate(test.end_time || test.start_time)}</span>
              </div>
              
              <div className="history-item-body">
                <div className="score-section">
                  <span className="score-label">Puntuación</span>
                  <span 
                    className="score-value" 
                    style={{ color: getScoreColor(test.score) }}
                  >
                    {test.score}%
                  </span>
                </div>
                
                <div className="stats-section">
                  <div className="stat-item">
                    <span className="stat-label">Aciertos</span>
                    <span className="stat-value">{test.correct}/{test.total}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Duración</span>
                    <span className="stat-value">{formatDuration(test.duration || 0)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Preguntas inválidas</span>
                    <span className="stat-value">
                      {test.questions_replaced || 0}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="history-item-footer">
                <button className="btn-review">
                  Ver detalles →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {selectedTest && (
        <TestDetailModal 
          test={selectedTest}
          onClose={() => setSelectedTest(null)}
        />
      )}
    </div>
  );
}

function TestDetailModal({ test, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Detalles del Test</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="test-summary">
            <div className="summary-item">
              <span>Fecha:</span>
              <strong>{new Date(test.end_time || test.start_time).toLocaleString('es-ES')}</strong>
            </div>
            <div className="summary-item">
              <span>Puntuación:</span>
              <strong style={{ color: test.score >= 60 ? '#10b981' : '#ef4444' }}>
                {test.score}%
              </strong>
            </div>
            <div className="summary-item">
              <span>Preguntas acertadas:</span>
              <strong>{test.correct} de {test.total}</strong>
            </div>
            <div className="summary-item">
              <span>Tiempo empleado:</span>
              <strong>{test.duration || 0} minutos</strong>
            </div>
            <div className="summary-item">
              <span>Preguntas inválidas reemplazadas:</span>
              <strong>{test.questions_replaced || 0}</strong>
            </div>
          </div>

          <div className="test-categories">
            <h4>Distribución por categorías</h4>
            <p className="coming-soon">Próximamente: análisis detallado por categorías</p>
          </div>

          <div className="test-invalid-questions">
            <h4>Preguntas marcadas como inválidas</h4>
            {Array.isArray(test.replaced_question_ids) && test.replaced_question_ids.length > 0 ? (
              <ul className="invalid-questions-list">
                {test.replaced_question_ids.map(id => (
                  <li key={id}>Pregunta #{id}</li>
                ))}
              </ul>
            ) : (
              <p className="no-invalid-questions">
                No se marcaron preguntas como inválidas en este test.
              </p>
            )}
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}