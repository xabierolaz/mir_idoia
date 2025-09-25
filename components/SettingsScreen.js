import React, { useState, useEffect } from 'react';
import { QuizStorage } from '../lib/kv-client';

const storage = new QuizStorage();

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
  
  useEffect(() => {
    loadConfig();
  }, []);
  
  const loadConfig = async () => {
    try {
      const userConfig = await storage.getUserConfig();
      setConfig(userConfig);
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
      await storage.updateUserConfig(config);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Error al guardar la configuración');
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