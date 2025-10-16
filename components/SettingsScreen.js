import React, { useState, useEffect } from 'react';

export default function SettingsScreen({ onBack }) {
  const [config, setConfig] = useState({
    timer_enabled: true,
    timer_minutes: 120,
    show_feedback: true,
    show_statistics: true,
    questions_per_test: 100
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [invalidQuestions, setInvalidQuestions] = useState([]);
  const [loadingInvalid, setLoadingInvalid] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  
  useEffect(() => {
    loadConfig();
    loadInvalidQuestions();
  }, []);
  
  const loadConfig = async () => {
    try {
      const response = await fetch('/api/config');
      const data = await response.json();
      setConfig(data.config);
      console.log('✅ Configuración cargada desde KV:', data.config);
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const handleChange = (key, value) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveConfig = async () => {
    setSaving(true);
    setSaved(false);

    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      const data = await response.json();

      if (data.status === 'ok') {
        console.log('✅ Configuración guardada en KV:', data.config);
        setConfig(data.config); // Actualizar con la configuración confirmada del servidor
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        throw new Error(data.error || 'Error saving config');
      }
    } catch (error) {
      console.error('❌ Error saving config:', error);
      alert('Error al guardar la configuración: ' + error.message);
    } finally {
      setSaving(false);
    }
  };
  
  const resetConfig = () => {
    if (confirm('¿Estás seguro de que quieres restaurar la configuración predeterminada?')) {
      setConfig({
        timer_enabled: true,
        timer_minutes: 120,
        show_feedback: true,
        show_statistics: true,
        questions_per_test: 100
      });
    }
  };
  
  const loadInvalidQuestions = async () => {
    setLoadingInvalid(true);
    try {
      const response = await fetch('/api/get-invalid-questions');
      const data = await response.json();
      
      if (data.success) {
        setInvalidQuestions(data.invalidQuestions);
      }
    } catch (error) {
      console.error('Error loading invalid questions:', error);
    } finally {
      setLoadingInvalid(false);
    }
  };
  
  const startEditingQuestion = (question) => {
    setEditingQuestion({
      ...question,
      pregunta: question.pregunta,
      opciones: { ...question.opciones },
      correcta: question.correcta
    });
  };
  
  const cancelEditingQuestion = () => {
    setEditingQuestion(null);
  };
  
  const saveEditedQuestion = async () => {
    if (!editingQuestion) return;
    
    try {
      const response = await fetch('/api/update-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: editingQuestion.id,
          pregunta: editingQuestion.pregunta,
          opciones: editingQuestion.opciones,
          correcta: editingQuestion.correcta
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✏️ Pregunta corregida exitosamente');
        setEditingQuestion(null);
        // Actualizar la pregunta en la lista local
        setInvalidQuestions(prev => 
          prev.map(q => 
            q.id === editingQuestion.id 
              ? { ...q, ...editingQuestion, corrected: true }
              : q
          )
        );
      } else {
        alert('Error al guardar la pregunta corregida');
      }
    } catch (error) {
      console.error('Error saving edited question:', error);
      alert('Error al guardar la pregunta corregida');
    }
  };
  
  const returnQuestionToPool = async (questionId) => {
    if (!confirm('¿Estás seguro de que quieres devolver esta pregunta al pool de preguntas válidas?')) {
      return;
    }
    
    try {
      const response = await fetch('/api/return-to-pool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_id: questionId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('🔄 Pregunta devuelta al pool exitosamente');
        // Remover de la lista local
        setInvalidQuestions(prev => prev.filter(q => q.id !== questionId));
      } else {
        alert('Error al devolver la pregunta al pool');
      }
    } catch (error) {
      console.error('Error returning question to pool:', error);
      alert('Error al devolver la pregunta al pool');
    }
  };

  // Componente para mostrar una pregunta inválida
  const QuestionDisplay = ({ question, onEdit, onReturnToPool }) => (
    <div className="question-display">
      <div className="question-text">
        <strong>Pregunta:</strong> {question.pregunta}
      </div>
      
      <div className="question-options">
        <strong>Opciones:</strong>
        <div className="options-grid">
          {Object.entries(question.opciones).map(([key, value]) => (
            <div 
              key={key} 
              className={`option-item ${key === question.correcta ? 'correct-option' : ''}`}
            >
              <span className="option-letter">{key.toUpperCase()})</span>
              <span className="option-text">{value}</span>
              {key === question.correcta && <span className="correct-indicator">✓</span>}
            </div>
          ))}
        </div>
      </div>
      
      <div className="question-actions">
        <button 
          className="btn btn-small btn-secondary"
          onClick={() => onEdit(question)}
        >
          ✏️ Editar
        </button>
        <button 
          className="btn btn-small btn-success"
          onClick={() => onReturnToPool(question.id)}
        >
          ✅ Devolver al pool
        </button>
      </div>
    </div>
  );

  // Componente para editar una pregunta
  const QuestionEditor = ({ question, onChange, onSave, onCancel }) => (
    <div className="question-editor">
      <div className="editor-field">
        <label>Pregunta:</label>
        <textarea
          value={question.pregunta}
          onChange={(e) => onChange({ ...question, pregunta: e.target.value })}
          rows={3}
          className="question-textarea"
        />
      </div>
      
      <div className="editor-field">
        <label>Opciones:</label>
        <div className="options-editor">
          {['a', 'b', 'c', 'd'].map((key) => (
            <div key={key} className="option-editor">
              <span className="option-label">{key.toUpperCase()})</span>
              <input
                type="text"
                value={question.opciones[key]}
                onChange={(e) => onChange({
                  ...question,
                  opciones: { ...question.opciones, [key]: e.target.value }
                })}
                className="option-input"
              />
              <label className="correct-radio">
                <input
                  type="radio"
                  name={`correct-${question.id}`}
                  checked={question.correcta === key}
                  onChange={() => onChange({ ...question, correcta: key })}
                />
                <span>Correcta</span>
              </label>
            </div>
          ))}
        </div>
      </div>
      
      <div className="editor-actions">
        <button 
          className="btn btn-small btn-primary"
          onClick={onSave}
        >
          💾 Guardar cambios
        </button>
        <button 
          className="btn btn-small btn-secondary"
          onClick={onCancel}
        >
          ❌ Cancelar
        </button>
      </div>
    </div>
  );
  
  return (
    <div className="container fade-in">
      <div className="settings-screen">
        <div className="settings-header">
          <button className="btn-back" onClick={onBack}>
            ← Volver
          </button>
          <h2>Configuración</h2>
        </div>
        
        <div className="settings-content">
          <div className="settings-section">
            <h3>Configuración del Test</h3>
            
            <div className="setting-item">
              <div className="setting-label">
                <span>Número de preguntas por test</span>
                <span className="setting-description">
                  Cantidad de preguntas que se mostrarán en cada test
                </span>
              </div>
              <div className="setting-control">
                <select 
                  value={config.questions_per_test}
                  onChange={(e) => handleChange('questions_per_test', parseInt(e.target.value))}
                  className="select-input"
                >
                  <option value="25">25 preguntas</option>
                  <option value="50">50 preguntas</option>
                  <option value="75">75 preguntas</option>
                  <option value="100">100 preguntas</option>
                  <option value="150">150 preguntas</option>
                </select>
              </div>
            </div>
            
            <div className="setting-item">
              <div className="setting-label">
                <span>Temporizador</span>
                <span className="setting-description">
                  Activar límite de tiempo para completar el test
                </span>
              </div>
              <div className="setting-control">
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={config.timer_enabled}
                    onChange={(e) => handleChange('timer_enabled', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
            
            {config.timer_enabled && (
              <div className="setting-item">
                <div className="setting-label">
                  <span>Tiempo límite (minutos)</span>
                  <span className="setting-description">
                    Duración máxima del test en minutos
                  </span>
                </div>
                <div className="setting-control">
                  <input 
                    type="number"
                    min="30"
                    max="300"
                    step="30"
                    value={config.timer_minutes}
                    onChange={(e) => handleChange('timer_minutes', parseInt(e.target.value) || 120)}
                    className="number-input"
                  />
                </div>
              </div>
            )}
            
            <div className="setting-item">
              <div className="setting-label">
                <span>Mostrar feedback inmediato</span>
                <span className="setting-description">
                  Mostrar si la respuesta es correcta o incorrecta al seleccionarla
                </span>
              </div>
              <div className="setting-control">
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={config.show_feedback}
                    onChange={(e) => handleChange('show_feedback', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
            
            <div className="setting-item">
              <div className="setting-label">
                <span>Mostrar estadísticas en tiempo real</span>
                <span className="setting-description">
                  Mostrar progreso y estadísticas durante el test
                </span>
              </div>
              <div className="setting-control">
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={config.show_statistics}
                    onChange={(e) => handleChange('show_statistics', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
          
          {/* Sección de Preguntas Inválidas */}
          <div className="settings-section">
            <h3>Gestión de Preguntas Inválidas</h3>
            <p className="section-description">
              Administra las preguntas marcadas como inválidas durante los exámenes. 
              Puedes editarlas y devolverlas al pool de preguntas válidas.
            </p>
            
            {loadingInvalid ? (
              <div className="loading-invalid">
                <div className="loading-spinner"></div>
                <p>Cargando preguntas inválidas...</p>
              </div>
            ) : invalidQuestions.length === 0 ? (
              <div className="no-invalid-questions">
                <div className="empty-state">
                  <span className="empty-icon">✅</span>
                  <h4>No hay preguntas inválidas</h4>
                  <p>Todas las preguntas están en el pool de preguntas válidas.</p>
                </div>
              </div>
            ) : (
              <div className="invalid-questions-list">
                <div className="invalid-questions-header">
                  <span className="invalid-count">
                    {invalidQuestions.length} pregunta{invalidQuestions.length !== 1 ? 's' : ''} marcada{invalidQuestions.length !== 1 ? 's' : ''} como inválida{invalidQuestions.length !== 1 ? 's' : ''}
                  </span>
                  <button 
                    className="btn btn-small btn-secondary"
                    onClick={loadInvalidQuestions}
                  >
                    🔄 Actualizar
                  </button>
                </div>
                
                {invalidQuestions.map((question) => (
                  <div key={question.id} className="invalid-question-item">
                    <div className="question-header-info">
                      <span className="question-id">ID: {question.id}</span>
                      <span className="question-date">
                        Marcada: {new Date(question.invalidInfo.marked_invalid_at).toLocaleDateString()}
                      </span>
                      {question.corrected && (
                        <span className="corrected-badge">✏️ Corregida</span>
                      )}
                    </div>
                    
                    {editingQuestion && editingQuestion.id === question.id ? (
                      <QuestionEditor 
                        question={editingQuestion}
                        onChange={setEditingQuestion}
                        onSave={saveEditedQuestion}
                        onCancel={cancelEditingQuestion}
                      />
                    ) : (
                      <QuestionDisplay 
                        question={question}
                        onEdit={startEditingQuestion}
                        onReturnToPool={returnQuestionToPool}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="settings-actions">
            <button 
              className="btn btn-primary" 
              onClick={saveConfig}
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
            
            <button 
              className="btn btn-secondary" 
              onClick={resetConfig}
            >
              Restaurar valores predeterminados
            </button>
            
            {saved && (
              <div className="save-message">
                ✓ Configuración guardada correctamente
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}