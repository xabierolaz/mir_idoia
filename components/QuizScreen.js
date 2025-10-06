import React, { useState, useEffect } from 'react';
import Timer from './Timer';
import { QuizStorage } from '../lib/kv-client';
import { validateAnswer, validateAnswers } from '../lib/answer-validation';

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
  const [invalidQuestions, setInvalidQuestions] = useState(new Set()); // Track invalid questions
  const [extraQuestionsLoaded, setExtraQuestionsLoaded] = useState(false);
  
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
        setInvalidQuestions(new Set(savedState.invalidQuestions || []));
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
    
    // USAR VALIDACIÓN CENTRALIZADA
    const isCorrect = validateAnswer(option, question.correcta);
    
    // Log para debugging (se puede remover en producción)
    console.log(`🔍 Validación: Pregunta ${question.id}, Usuario: "${option}", Correcta: "${question.correcta}", ¿Correcta?: ${isCorrect}`);
    
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
    
    // Guardar respuesta en Vercel KV SOLO SI NO ES PREGUNTA INVÁLIDA
    if (!invalidQuestions.has(question.id)) {
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
    } else {
      console.log(`🚫 Pregunta ${question.id} marcada como inválida - no se guardará en estadísticas`);
    }
    
    // Guardar estado del test
    await saveTestState(newAnswers);
  };
  
  const toggleInvalidQuestion = async (questionId) => {
    const newInvalidQuestions = new Set(invalidQuestions);
    
    if (newInvalidQuestions.has(questionId)) {
      newInvalidQuestions.delete(questionId);
    } else {
      newInvalidQuestions.add(questionId);
    }
    
    setInvalidQuestions(newInvalidQuestions);
    
    // Marcar pregunta como inválida en la base de datos para futuro reporte
    try {
      await fetch('/api/mark-invalid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: questionId,
          is_invalid: newInvalidQuestions.has(questionId)
        })
      });
      
      console.log(`${newInvalidQuestions.has(questionId) ? '🚫' : '✅'} Pregunta ${questionId} marcada como ${newInvalidQuestions.has(questionId) ? 'inválida' : 'válida'}`);
    } catch (error) {
      console.error('Error marking question as invalid:', error);
    }
    
    // Guardar estado actualizado
    await saveTestState();
    
    // Si necesitamos cargar preguntas extra y no lo hemos hecho aún
    if (newInvalidQuestions.size > 0 && !extraQuestionsLoaded) {
      await loadExtraQuestions();
    }
  };
  
  const loadExtraQuestions = async () => {
    try {
      const response = await fetch(`/api/questions?extra=${invalidQuestions.size}`);
      const extraQuestions = await response.json();
      
      // Agregar preguntas extra al final
      setQuestions(prevQuestions => [...prevQuestions, ...extraQuestions]);
      setExtraQuestionsLoaded(true);
      
      console.log(`📚 Cargadas ${extraQuestions.length} preguntas extra para compensar inválidas`);
    } catch (error) {
      console.error('Error loading extra questions:', error);
    }
  };

  const saveTestState = async (currentAnswers = answers) => {
    const state = {
      questions,
      currentIndex,
      answers: currentAnswers,
      elapsedTime,
      startTime,
      isPaused,
      invalidQuestions: Array.from(invalidQuestions)
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
    // Filtrar preguntas válidas para cálculos finales
    const validQuestions = questions.filter(q => !invalidQuestions.has(q.id));
    const validAnswers = {};
    
    // Solo incluir respuestas de preguntas válidas
    validQuestions.forEach(q => {
      if (answers[q.id]) {
        validAnswers[q.id] = answers[q.id];
      }
    });
    
    // USAR VALIDACIÓN CENTRALIZADA solo con preguntas válidas
    const results = validateAnswers(validQuestions, validAnswers);
    const { correct, detailedResults } = results;
    
    // Log completo del análisis final
    console.log('📊 ANÁLISIS FINAL DE RESPUESTAS:');
    console.log(`Total preguntas: ${questions.length}`);
    console.log(`Preguntas válidas: ${validQuestions.length}`);
    console.log(`Preguntas inválidas: ${invalidQuestions.size}`);
    console.log(`Preguntas respondidas (válidas): ${detailedResults.filter(r => r.userAnswer !== null).length}`);
    console.log(`Respuestas correctas: ${correct}`);
    console.log('Detalle por pregunta:', detailedResults);
    console.log('Preguntas marcadas como inválidas:', Array.from(invalidQuestions));
    
    const score = validQuestions.length > 0 ? Math.round((correct / validQuestions.length) * 100) : 0;
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
          total: validQuestions.length,
          total_questions_shown: questions.length,
          invalid_questions: Array.from(invalidQuestions),
          answers: validAnswers,
          all_answers: answers
        })
      });
      
      console.log(`✅ Test completo guardado en Vercel: ${score}% (${correct}/${validQuestions.length})`);
    } catch (error) {
      console.error('❌ Error saving test to Vercel:', error);
    }
    
    // Limpiar estado guardado
    await storage.clearTestState();
    
    // Pasar resultados al componente padre
    onComplete({
      questions: validQuestions,
      answers: validAnswers,
      correct,
      total: validQuestions.length,
      score,
      duration: Math.round((endTime - startTime) / 1000 / 60),
      invalidQuestions: Array.from(invalidQuestions),
      totalQuestionsShown: questions.length
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
  const validQuestionsCount = questions.filter(q => !invalidQuestions.has(q.id)).length;
  const currentValidIndex = questions.slice(0, currentIndex + 1).filter(q => !invalidQuestions.has(q.id)).length;
  const progress = validQuestionsCount > 0 ? (currentValidIndex / validQuestionsCount) * 100 : 0;
  const questionFeedback = feedbackState[question.id];
  const isCurrentQuestionInvalid = invalidQuestions.has(question.id);
  
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
            {invalidQuestions.size > 0 && (
              <span className="valid-count">
                ({validQuestionsCount} válidas{invalidQuestions.size > 0 ? `, ${invalidQuestions.size} inválidas` : ''})
              </span>
            )}
          </span>
          <span className="category-tag">
            {formatCategory(question.categoria)}
          </span>
          {isCurrentQuestionInvalid && (
            <span className="invalid-tag">
              🚫 INVÁLIDA
            </span>
          )}
        </div>
        
        <div className="question-text">
          {question.pregunta}
        </div>
        
        <div className="invalid-question-control">
          <label className="invalid-checkbox-label">
            <input
              type="checkbox"
              checked={invalidQuestions.has(question.id)}
              onChange={() => toggleInvalidQuestion(question.id)}
              disabled={isPaused}
              className="invalid-checkbox"
            />
            <span className="checkmark">🚫</span>
            <span className="invalid-text">Marcar como pregunta inválida</span>
          </label>
          {invalidQuestions.has(question.id) && (
            <div className="invalid-notice">
              ⚠️ Esta pregunta no contará en las estadísticas ni en el resultado final
            </div>
          )}
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
          <span>
            Progreso del test 
            {invalidQuestions.size > 0 && (
              <small> (solo preguntas válidas)</small>
            )}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
        {invalidQuestions.size > 0 && (
          <div className="progress-note">
            📊 {currentValidIndex} de {validQuestionsCount} preguntas válidas respondidas
          </div>
        )}
      </div>
    </div>
  );
}