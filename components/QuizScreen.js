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
  
  const markQuestionAsInvalid = async (questionId) => {
    // No permitir marcar como inválida si ya está marcada
    if (invalidQuestions.has(questionId)) {
      console.log(`⚠️ Pregunta ${questionId} ya está marcada como inválida`);
      return;
    }
    
    console.log(`🚫 Marcando pregunta ${questionId} como inválida y cargando reemplazo...`);
    
    // 1. Marcar como inválida en la base de datos
    try {
      await fetch('/api/mark-invalid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: questionId,
          is_invalid: true
        })
      });
      
      console.log(`✅ Pregunta ${questionId} guardada como inválida en KV`);
    } catch (error) {
      console.error('Error marking question as invalid:', error);
      alert('Error al marcar la pregunta como inválida');
      return;
    }
    
    // 2. Obtener IDs de todas las preguntas actuales para excluir del reemplazo
    const currentQuestionIds = questions.map(q => q.id);
    
    // 3. Cargar pregunta de reemplazo
    try {
      const response = await fetch(`/api/questions?replace=1&exclude=${currentQuestionIds.join(',')}`);
      
      if (!response.ok) {
        throw new Error('No se pudo cargar pregunta de reemplazo');
      }
      
      const replacementQuestion = await response.json();
      console.log(`🔄 Pregunta de reemplazo cargada: ID ${replacementQuestion.id}`);
      
      // 4. Actualizar estado local
      const newInvalidQuestions = new Set(invalidQuestions);
      newInvalidQuestions.add(questionId);
      setInvalidQuestions(newInvalidQuestions);
      
      // 5. Reemplazar la pregunta en el array actual
      const newQuestions = [...questions];
      newQuestions[currentIndex] = replacementQuestion;
      setQuestions(newQuestions);
      
      // 6. Limpiar respuesta anterior y feedback
      const newAnswers = { ...answers };
      delete newAnswers[questionId]; // Eliminar respuesta de pregunta inválida
      setAnswers(newAnswers);
      
      const newFeedback = { ...feedbackState };
      delete newFeedback[questionId]; // Limpiar feedback
      setFeedbackState(newFeedback);
      
      // 7. Guardar estado actualizado
      await saveTestState(newAnswers);
      
      console.log(`✨ Pregunta ${questionId} reemplazada exitosamente por pregunta ${replacementQuestion.id}`);
      
    } catch (error) {
      console.error('Error loading replacement question:', error);
      alert('Error al cargar pregunta de reemplazo. La pregunta se mantendrá en el test.');
      
      // Si falla el reemplazo, revertir el marcado como inválida
      try {
        await fetch('/api/mark-invalid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question_id: questionId,
            is_invalid: false
          })
        });
      } catch (revertError) {
        console.error('Error reverting invalid mark:', revertError);
      }
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
    // Como el array siempre contiene solo preguntas válidas, simplificamos
    const results = validateAnswers(questions, answers);
    const { correct, detailedResults } = results;
    
    // Log completo del análisis final
    console.log('📊 ANÁLISIS FINAL DE RESPUESTAS:');
    console.log(`Total preguntas válidas: ${questions.length}`);
    console.log(`Preguntas reemplazadas durante el test: ${invalidQuestions.size}`);
    console.log(`Preguntas respondidas: ${detailedResults.filter(r => r.userAnswer !== null).length}`);
    console.log(`Respuestas correctas: ${correct}`);
    console.log('Detalle por pregunta:', detailedResults);
    if (invalidQuestions.size > 0) {
      console.log('Preguntas reemplazadas automáticamente:', Array.from(invalidQuestions));
    }
    
    const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
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
          questions_replaced: invalidQuestions.size,
          replaced_question_ids: Array.from(invalidQuestions),
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
      duration: Math.round((endTime - startTime) / 1000 / 60),
      questionsReplaced: invalidQuestions.size,
      replacedQuestionIds: Array.from(invalidQuestions)
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
            {invalidQuestions.size > 0 && (
              <span className="valid-count">
                ({invalidQuestions.size} reemplazadas automáticamente)
              </span>
            )}
          </span>
          <span className="category-tag">
            {formatCategory(question.categoria)}
          </span>
        </div>
        
        <div className="question-text">
          {question.pregunta}
        </div>
        
        <div className="invalid-question-control">
          <label className="invalid-checkbox-label">
            <input
              type="checkbox"
              checked={invalidQuestions.has(question.id)}
              onChange={() => markQuestionAsInvalid(question.id)}
              disabled={isPaused || invalidQuestions.has(question.id)}
              className="invalid-checkbox"
            />
            <span className="checkmark">🚫</span>
            <span className="invalid-text">
              {invalidQuestions.has(question.id) 
                ? 'Pregunta marcada como inválida' 
                : 'Marcar como pregunta inválida'
              }
            </span>
          </label>
          {invalidQuestions.has(question.id) && (
            <div className="invalid-notice">
              ⚠️ Esta pregunta ha sido marcada como inválida y será reemplazada
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
          <span>Progreso del test</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
        {invalidQuestions.size > 0 && (
          <div className="progress-note">
            📝 {invalidQuestions.size} pregunta{invalidQuestions.size !== 1 ? 's' : ''} reemplazada{invalidQuestions.size !== 1 ? 's' : ''} automáticamente
          </div>
        )}
      </div>
    </div>
  );
}