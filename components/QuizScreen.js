import React, { useState, useEffect } from 'react';
import Timer from './Timer';
import { QuizStorage } from '../lib/kv-client';

const storage = new QuizStorage();

export default function QuizScreen({ onComplete }) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [startTime] = useState(new Date());
  const [isPaused, setIsPaused] = useState(false);
  const [config, setConfig] = useState({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  useEffect(() => {
    loadInitialData();
  }, []);
  
  const loadInitialData = async () => {
    try {
      // Cargar configuración del usuario
      const userConfig = await storage.getUserConfig();
      setConfig(userConfig);
      
      // Verificar si hay un test en curso
      const savedState = await storage.getTestState();
      if (savedState && savedState.questions) {
        // Restaurar estado guardado
        setQuestions(savedState.questions);
        setCurrentIndex(savedState.currentIndex || 0);
        setAnswers(savedState.answers || {});
        setElapsedTime(savedState.elapsedTime || 0);
        setLoading(false);
      } else {
        // Cargar nuevas preguntas
        await loadQuestions();
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      await loadQuestions();
    }
  };
  
  const loadQuestions = async () => {
    try {
      const response = await fetch('/api/questions');
      const data = await response.json();
      setQuestions(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading questions:', error);
      alert('Error al cargar las preguntas. Por favor, recarga la página.');
    }
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
  
  const selectAnswer = async (option) => {
    const question = questions[currentIndex];
    const isCorrect = option === question.correcta;
    
    // Actualizar respuestas locales
    const newAnswers = {
      ...answers,
      [question.id]: option
    };
    setAnswers(newAnswers);
    
    // Mostrar feedback si está habilitado
    if (config.show_feedback) {
      setShowFeedback(true);
    }
    
    // Guardar estado del test
    await saveTestState(newAnswers);
    
    // Guardar respuesta en el servidor
    try {
      await fetch('/api/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: question.id,
          answer: option,
          is_correct: isCorrect
        })
      });
    } catch (error) {
      console.error('Error saving answer:', error);
    }
  };
  
  const saveTestState = async (currentAnswers = answers) => {
    const state = {
      questions,
      currentIndex,
      answers: currentAnswers,
      elapsedTime,
      startTime,
      isPaused
    };
    await storage.saveTestState(state);
  };
  
  const togglePause = async () => {
    setIsPaused(!isPaused);
    await saveTestState();
  };
  
  const previousQuestion = () => {
    if (currentIndex > 0) {
      setShowFeedback(false);
      setCurrentIndex(currentIndex - 1);
    }
  };
  
  const nextQuestion = () => {
    setShowFeedback(false);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      finishTest();
    }
  };
  
  const handleTimeUp = () => {
    alert('¡Tiempo agotado! El test se finalizará automáticamente.');
    finishTest();
  };
  
  const finishTest = async () => {
    // Calcular resultados
    let correct = 0;
    questions.forEach(question => {
      if (answers[question.id] === question.correcta) {
        correct++;
      }
    });
    
    const score = Math.round((correct / questions.length) * 100);
    const endTime = new Date();
    
    // Guardar test completo
    try {
      await fetch('/api/complete-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          score,
          correct,
          total: questions.length,
          answers
        })
      });
    } catch (error) {
      console.error('Error saving test:', error);
    }
    
    // Limpiar estado guardado
    await storage.clearTestState();
    
    // Pasar resultados al componente padre
    onComplete({
      questions,
      answers,
      correct,
      total: questions.length,
      score,
      duration: Math.round((endTime - startTime) / 1000 / 60)
    });
  };
  
  // Auto-guardar estado cada vez que cambia
  useEffect(() => {
    if (questions.length > 0 && !loading) {
      const interval = setInterval(() => {
        if (!isPaused) {
          setElapsedTime(prev => prev + 1);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [questions, loading, isPaused]);
  
  useEffect(() => {
    if (questions.length > 0 && !loading) {
      saveTestState();
    }
  }, [currentIndex, isPaused]);
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Preparando test personalizado...</p>
      </div>
    );
  }
  
  const question = questions[currentIndex];
  const selectedAnswer = answers[question.id];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const isCorrect = selectedAnswer && selectedAnswer === question.correcta;
  
  return (
    <div className="container fade-in">
      {config.timer_enabled && (
        <Timer
          initialTime={config.timer_minutes * 60}
          isPaused={isPaused}
          onTimeUp={handleTimeUp}
        />
      )}
      
      <div className="controls-bar">
        <button 
          className={`btn ${isPaused ? 'btn-success' : 'btn-warning'}`}
          onClick={togglePause}
        >
          {isPaused ? '▶ Reanudar' : '‖ Pausar'}
        </button>
        <span className="test-status">
          {isPaused ? 'TEST EN PAUSA' : 'TEST EN CURSO'}
        </span>
      </div>
      
      <div className="question-card">
        <div className="question-header">
          <span className="question-number">
            Pregunta {currentIndex + 1} de {questions.length}
          </span>
          <span className="category-tag">
            {formatCategory(question.categoria)}
          </span>
        </div>
        
        <div className="question-text">
          {question.pregunta}
        </div>
        
        <div className="options">
          {Object.entries(question.opciones).map(([key, value]) => {
            const isSelected = selectedAnswer === key;
            const isCorrectOption = key === question.correcta;
            
            let optionClass = 'option';
            if (showFeedback && isSelected) {
              optionClass += isCorrect ? ' correct' : ' incorrect';
            }
            if (showFeedback && !isSelected && isCorrectOption) {
              optionClass += ' correct-answer';
            }
            if (!showFeedback && isSelected) {
              optionClass += ' selected';
            }
            
            return (
              <div
                key={key}
                className={optionClass}
                onClick={() => !showFeedback && !isPaused && selectAnswer(key)}
                style={{ cursor: showFeedback || isPaused ? 'default' : 'pointer' }}
              >
                <span className="option-letter">{key.toUpperCase()})</span>
                {value}
              </div>
            );
          })}
        </div>
        
        {showFeedback && (
          <div className={`feedback-message ${isCorrect ? 'correct' : 'incorrect'}`}>
            {isCorrect ? '✓ ¡Correcto!' : '✗ Incorrecto'}
            {!isCorrect && (
              <div className="correct-answer-text">
                Respuesta correcta: {question.correcta.toUpperCase()}
              </div>
            )}
          </div>
        )}
        
        <div className="navigation">
          <button 
            className="btn btn-secondary" 
            onClick={previousQuestion}
            disabled={currentIndex === 0 || isPaused}
          >
            ← Anterior
          </button>
          <button 
            className="btn btn-primary" 
            onClick={nextQuestion}
            disabled={!selectedAnswer || isPaused}
          >
            {currentIndex === questions.length - 1 ? 'Finalizar Test' : 'Siguiente →'}
          </button>
        </div>
        
        {isPaused && (
          <div className="paused-overlay">
            <h2>Test en pausa</h2>
            <p>Haz clic en "Reanudar" para continuar</p>
          </div>
        )}
      </div>
      
      <div className="progress-container">
        <div className="progress-text">
          <span>Progreso del test</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
      </div>
    </div>
  );
}