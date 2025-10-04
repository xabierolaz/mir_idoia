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
  const [feedbackState, setFeedbackState] = useState({}); // { questionId: { show: true, isCorrect: boolean } }
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
    if (isPaused) return; // No permitir responder si está pausado
    
    const question = questions[currentIndex];
    const isCorrect = option === question.correcta;
    
    // Actualizar respuestas locales
    const newAnswers = {
      ...answers,
      [question.id]: option
    };
    setAnswers(newAnswers);
    
    // MOSTRAR FEEDBACK INMEDIATO si está habilitado
    if (config.show_feedback !== false) { // Por defecto true
      setFeedbackState({
        ...feedbackState,
        [question.id]: { show: true, isCorrect }
      });
    }
    
    // Guardar respuesta en Vercel KV INMEDIATAMENTE
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
      
      console.log(`✅ Respuesta guardada en Vercel: Q${question.id} = ${option} (${isCorrect ? 'CORRECTA' : 'INCORRECTA'})`);
    } catch (error) {
      console.error('❌ Error saving answer to Vercel:', error);
      // Continuar aunque falle el guardado
    }
    
    // Guardar estado del test
    await saveTestState(newAnswers);
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
    
    try {
      await storage.saveTestState(state);
    } catch (error) {
      console.error('Error saving test state:', error);
    }
  };
  
  const togglePause = async () => {
    const newPausedState = !isPaused;
    setIsPaused(newPausedState);
    await saveTestState();
    
    // Limpiar feedback al pausar
    if (newPausedState) {
      setFeedbackState({});
    }
  };
  
  const previousQuestion = () => {
    if (currentIndex > 0 && !isPaused) {
      // Limpiar feedback de la pregunta actual
      const currentQuestion = questions[currentIndex];
      const newFeedback = { ...feedbackState };
      delete newFeedback[currentQuestion.id];
      setFeedbackState(newFeedback);
      
      setCurrentIndex(currentIndex - 1);
    }
  };
  
  const nextQuestion = () => {
    if (isPaused) return;
    
    // Limpiar feedback de la pregunta actual
    const currentQuestion = questions[currentIndex];
    const newFeedback = { ...feedbackState };
    delete newFeedback[currentQuestion.id];
    setFeedbackState(newFeedback);
    
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
    
    // Guardar test completo en Vercel
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
      
      console.log(`✅ Test completo guardado en Vercel: ${score}% (${correct}/${questions.length})`);
    } catch (error) {
      console.error('❌ Error saving test to Vercel:', error);
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
  
  // Auto-guardar estado y manejar timer
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
  const questionFeedback = feedbackState[question.id];
  
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
          {isPaused ? '▶ Reanudar' : '⏸ Pausar'}
        </button>
        <span className="test-status">
          {isPaused ? 'TEST EN PAUSA' : 'TEST EN CURSO'}
        </span>
        <span className="auto-save-indicator">
          💾 Guardado automático en Vercel
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
            
            // Si hay feedback visible para esta pregunta
            if (questionFeedback && questionFeedback.show) {
              if (isSelected) {
                optionClass += questionFeedback.isCorrect ? ' correct' : ' incorrect';
              }
              if (!isSelected && isCorrectOption) {
                optionClass += ' correct-answer';
              }
            } else if (isSelected) {
              optionClass += ' selected';
            }
            
            return (
              <div
                key={key}
                className={optionClass}
                onClick={() => !questionFeedback?.show && selectAnswer(key)}
                style={{ 
                  cursor: (questionFeedback?.show || isPaused) ? 'default' : 'pointer',
                  pointerEvents: (questionFeedback?.show || isPaused) ? 'none' : 'auto'
                }}
              >
                <span className="option-letter">{key.toUpperCase()})</span>
                {value}
              </div>
            );
          })}
        </div>
        
        {/* FEEDBACK INMEDIATO */}
        {questionFeedback && questionFeedback.show && (
          <div className={`feedback-message ${questionFeedback.isCorrect ? 'correct' : 'incorrect'}`}>
            {questionFeedback.isCorrect ? (
              <>
                <strong>✅ ¡Correcto!</strong>
                <div className="feedback-explanation">Has seleccionado la respuesta correcta.</div>
              </>
            ) : (
              <>
                <strong>❌ Incorrecto</strong>
                <div className="feedback-explanation">
                  La respuesta correcta es: <strong>{question.correcta.toUpperCase()}</strong>
                </div>
              </>
            )}
            <div className="auto-save-notice">
              💾 Respuesta guardada automáticamente en Vercel
            </div>
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
            <p>Tu progreso está guardado en Vercel</p>
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