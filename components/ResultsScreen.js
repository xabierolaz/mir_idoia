import React from 'react';

export default function ResultsScreen({ results, onHome, onNewTest }) {
  const { correct, total, score, duration, questions, answers } = results;
  
  // Calcular resultados por categoría
  const calculateCategoryResults = () => {
    const byCategory = {};
    
    questions.forEach(question => {
      const userAnswer = answers[question.id];
      const isCorrect = userAnswer === question.correcta;
      const category = question.categoria || 'otros';
      
      if (!byCategory[category]) {
        byCategory[category] = { total: 0, correct: 0 };
      }
      
      byCategory[category].total++;
      if (isCorrect) byCategory[category].correct++;
    });
    
    return byCategory;
  };
  
  const formatCategory = (category) => {
    const categoryNames = {
      'examenes_navarra_pais_vasco': 'Exámenes Navarra y País Vasco',
      'mir_medicina_preventiva': 'MIR Medicina Preventiva',
      'renave_declaracion': 'Protocolos RENAVE',
      'leyes': 'Leyes',
      'plan_salud_navarra': 'Plan de Salud Navarra',
      'otros': 'Otros'
    };
    return categoryNames[category] || category;
  };
  
  const categoryResults = calculateCategoryResults();
  const scoreColor = score >= 80 ? 'var(--success)' : 
                    score >= 60 ? 'var(--warning)' : 'var(--error)';
  
  return (
    <div className="container fade-in">
      <div className="results-screen">
        <h1>Test Completado</h1>
        
        <div className="score-circle">
          <svg width="200" height="200">
            <circle 
              cx="100" 
              cy="100" 
              r="90" 
              fill="none" 
              stroke="var(--border)" 
              strokeWidth="12"
            />
            <circle 
              cx="100" 
              cy="100" 
              r="90" 
              fill="none" 
              stroke={scoreColor} 
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${score * 5.65} 565`}
            />
          </svg>
          <div className="score-text" style={{ color: scoreColor }}>
            {score}%
          </div>
        </div>
        
        <div className="results-details">
          <div className="detail-row">
            <span>Respuestas correctas</span>
            <span><strong>{correct}</strong> de {total}</span>
          </div>
          <div className="detail-row">
            <span>Tiempo empleado</span>
            <span><strong>{duration}</strong> minutos</span>
          </div>
          <div className="detail-row">
            <span>Promedio por pregunta</span>
            <span><strong>{Math.round(duration * 60 / total)}</strong> segundos</span>
          </div>
        </div>
        
        <div className="results-details">
          <h3 style={{ marginBottom: '1rem' }}>Resultados por categoría</h3>
          {Object.entries(categoryResults).map(([cat, data]) => (
            <div key={cat} className="detail-row">
              <span>{formatCategory(cat)}</span>
              <span>
                <strong>{Math.round(data.correct / data.total * 100)}%</strong> ({data.correct}/{data.total})
              </span>
            </div>
          ))}
        </div>
        
        <button className="btn btn-primary" onClick={onHome}>
          Volver al inicio
        </button>
        
        <button className="btn btn-secondary" onClick={onNewTest}>
          Hacer otro test
        </button>
      </div>
    </div>
  );
}