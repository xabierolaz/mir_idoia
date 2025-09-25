import React, { useState, useEffect } from 'react';

export default function QuizScreen({ onComplete }) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [startTime] = useState(new Date());
  
  useEffect(() => {
    loadQuestions();
  }, []);
  
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
    setAnswers({
      ...answers,
      [question.id]: option
    });
    
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
  
  const previousQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };
  
  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      finishTest();
    }
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
  
  return (
    <div className="container fade-in">
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
          {Object.entries(question.opciones).map(([key, value]) => (
            <div
              key={key}
              className={`option ${selectedAnswer === key ? 'selected' : ''}`}
              onClick={() => selectAnswer(key)}
            >
              <span className="option-letter">{key.toUpperCase()})</span>
              {value}
            </div>
          ))}
        </div>
        
        <div className="navigation">
          <button 
            className="btn btn-secondary" 
            onClick={previousQuestion}
            disabled={currentIndex === 0}
          >
            ← Anterior
          </button>
          <button 
            className="btn btn-primary" 
            onClick={nextQuestion}
            disabled={!selectedAnswer}
          >
            {currentIndex === questions.length - 1 ? 'Finalizar Test' : 'Siguiente →'}
          </button>
        </div>
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