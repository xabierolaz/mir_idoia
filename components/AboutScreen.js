import React from 'react';

export default function AboutScreen({ onBack }) {
  const features = [
    {
      icon: '🎯',
      title: 'Sistema de Repetición Espaciada',
      description: 'Algoritmo inteligente que prioriza las preguntas según tu rendimiento'
    },
    {
      icon: '⏱️',
      title: 'Temporizador Configurable',
      description: 'Simula las condiciones reales del examen con límite de tiempo'
    },
    {
      icon: '📊',
      title: 'Estadísticas Detalladas',
      description: 'Visualiza tu progreso con gráficos y análisis por categorías'
    },
    {
      icon: '💾',
      title: 'Persistencia en la Nube',
      description: 'Tu progreso se guarda automáticamente usando Vercel KV'
    },
    {
      icon: '📱',
      title: 'Diseño Responsivo',
      description: 'Funciona perfectamente en móviles, tablets y ordenadores'
    },
    {
      icon: '🔄',
      title: 'Revisión de Respuestas',
      description: 'Revisa tus tests completados y aprende de tus errores'
    }
  ];
  
  const stats = {
    totalQuestions: 1512,
    categories: 6,
    version: '2.0',
    lastUpdate: 'Enero 2025'
  };
  
  return (
    <div className="container fade-in">
      <div className="about-screen">
        <div className="about-header">
          <button className="btn-back" onClick={onBack}>
            ← Volver
          </button>
          <h2>Acerca de OPE Medicina Preventiva</h2>
        </div>
        
        <div className="about-content">
          <div className="about-section">
            <h3>Sobre esta aplicación</h3>
            <p>
              Sistema de estudio diseñado específicamente para la preparación de las 
              Oposiciones de Medicina Preventiva y Salud Pública. Esta aplicación 
              incluye {stats.totalQuestions} preguntas cuidadosamente seleccionadas 
              de exámenes anteriores y material de estudio relevante.
            </p>
          </div>
          
          <div className="about-section">
            <h3>Características principales</h3>
            <div className="features-grid">
              {features.map((feature, index) => (
                <div key={index} className="feature-card">
                  <div className="feature-icon">{feature.icon}</div>
                  <h4>{feature.title}</h4>
                  <p>{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="about-section">
            <h3>Categorías incluidas</h3>
            <ul className="categories-list">
              <li>Exámenes de Navarra y País Vasco</li>
              <li>MIR de Medicina Preventiva</li>
              <li>Protocolos RENAVE y Declaración</li>
              <li>Leyes sanitarias</li>
              <li>Plan de Salud de Navarra</li>
              <li>Otros temas relevantes</li>
            </ul>
          </div>
          
          <div className="about-section">
            <h3>Información técnica</h3>
            <div className="tech-info">
              <div className="info-item">
                <span>Versión:</span>
                <strong>{stats.version}</strong>
              </div>
              <div className="info-item">
                <span>Total de preguntas:</span>
                <strong>{stats.totalQuestions}</strong>
              </div>
              <div className="info-item">
                <span>Categorías:</span>
                <strong>{stats.categories}</strong>
              </div>
              <div className="info-item">
                <span>Última actualización:</span>
                <strong>{stats.lastUpdate}</strong>
              </div>
              <div className="info-item">
                <span>Tecnología:</span>
                <strong>Next.js + Vercel KV</strong>
              </div>
            </div>
          </div>
          
          <div className="about-section">
            <h3>Consejos de uso</h3>
            <ul className="tips-list">
              <li>Realiza tests diariamente para mantener un progreso constante</li>
              <li>Revisa siempre tus respuestas incorrectas al finalizar cada test</li>
              <li>Utiliza el temporizador para simular condiciones reales de examen</li>
              <li>Analiza tus estadísticas para identificar áreas de mejora</li>
              <li>Configura el número de preguntas según tu tiempo disponible</li>
            </ul>
          </div>
          
          <div className="about-footer">
            <p>
              💪 ¡Mucho ánimo en tu preparación!
            </p>
            <p className="disclaimer">
              Esta aplicación es una herramienta de estudio independiente y no está 
              afiliada con ninguna institución oficial.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}