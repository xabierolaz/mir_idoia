import React, { useState } from 'react';
import { validateAnswer, filterQuestionsByAnswer } from '../lib/answer-validation';

export default function ReviewScreen({ questions, answers, onBack }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filterMode, setFilterMode] = useState('all'); // all, correct, incorrect
  
  // Filtrar preguntas según el modo usando validación centralizada
  const getFilteredQuestions = () => {
    return filterQuestionsByAnswer(questions, answers, filterMode);
  };
  
  const filteredQuestions = getFilteredQuestions();
  const question = filteredQuestions[currentIndex];
  
  if (!question) {
    return (
      <div className="container fade-in">
        <div className="review-empty">
          <h2>No hay preguntas para revisar</h2>
          <button className="btn btn-primary" onClick={onBack}>
            Volver
          </button>
        </div>
      </div>
    );
  }
  
  const userAnswer = answers[question.id];
  const isCorrect = validateAnswer(userAnswer, question.correcta);
  
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
  
  const previousQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };
  
  const nextQuestion = () => {
    if (currentIndex < filteredQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };
  
  const goToQuestion = (index) => {
    setCurrentIndex(index);
  };
  
  const handleFilterChange = (mode) => {
    setFilterMode(mode);
    setCurrentIndex(0); // Reset al cambiar filtro
  };
  
  return (
    <div className="container fade-in">
      <div className="review-screen">
        <div className="review-header">
          <button className="btn-back" onClick={onBack}>
            ← Volver a resultados
          </button>
          <h2>Revisión del Test</h2>
        </div>
        
        <div className="review-filters">
          <button 
            className={`filter-btn ${filterMode === 'all' ? 'active' : ''}`}
            onClick={() => handleFilterChange('all')}
          >
            Todas ({questions.length})
          </button>
          <button 
            className={`filter-btn ${filterMode === 'correct' ? 'active' : ''}`}
            onClick={() => handleFilterChange('correct')}
          >
            Correctas ({filterQuestionsByAnswer(questions, answers, 'correct').length})
          </button>
          <button 
            className={`filter-btn ${filterMode === 'incorrect' ? 'active' : ''}`}
            onClick={() => handleFilterChange('incorrect')}
          >
            Incorrectas ({filterQuestionsByAnswer(questions, answers, 'incorrect').length})
          </button>
        </div>
        
        <div className="question-card">
          <div className="question-header">
            <span className="question-number">
              Pregunta {currentIndex + 1} de {filteredQuestions.length}
            </span>
            <span className="category-tag">
              {formatCategory(question.categoria)}
            </span>
            <span className={`result-tag ${isCorrect ? 'correct' : 'incorrect'}`}>
              {isCorrect ? '✓ Correcta' : '✗ Incorrecta'}
            </span>
          </div>
          
          <div className="question-text">
            {question.pregunta}
          </div>
          
          <div className="options review-mode">
            {Object.entries(question.opciones).map(([key, value]) => {
              const isUserAnswer = userAnswer === key;
              const isCorrectAnswer = key === question.correcta;
              
              let optionClass = 'option';
              if (isCorrectAnswer) {
                optionClass += ' correct';
              } else if (isUserAnswer && !isCorrect) {
                optionClass += ' incorrect';
              }
              
              return (
                <div key={key} className={optionClass}>
                  <span className="option-letter">{key.toUpperCase()})</span>
                  {value}
                  {isUserAnswer && (
                    <span className="answer-indicator">
                      {isCorrect ? ' ✓ Tu respuesta' : ' ✗ Tu respuesta'}
                    </span>
                  )}
                  {isCorrectAnswer && !isUserAnswer && (
                    <span className="answer-indicator correct-indicator">
                      ✓ Respuesta correcta
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          
          {question.explicacion && (
            <div className="explanation-box">
              <h4>Explicación:</h4>
              <p>{question.explicacion}</p>
            </div>
          )}
          
          <div className="navigation">
            <button 
              className="btn btn-secondary" 
              onClick={previousQuestion}
              disabled={currentIndex === 0}
            >
              ← Anterior
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={nextQuestion}
              disabled={currentIndex === filteredQuestions.length - 1}
            >
              Siguiente →
            </button>
          </div>
        </div>
        
        <div className="question-grid">
          <h3>Navegación rápida</h3>
          <div className="question-buttons">
            {filteredQuestions.map((q, index) => {
              const qIsCorrect = validateAnswer(answers[q.id], q.correcta);
              return (
                <button
                  key={index}
                  className={`question-btn ${qIsCorrect ? 'correct' : 'incorrect'} ${index === currentIndex ? 'active' : ''}`}
                  onClick={() => goToQuestion(index)}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}