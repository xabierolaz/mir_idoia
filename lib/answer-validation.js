/**
 * VALIDACIÓN ROBUSTA DE RESPUESTAS
 * 
 * Esta función asegura que la validación de respuestas sea consistente
 * en toda la aplicación (QuizScreen, ResultsScreen, ReviewScreen)
 */

export function validateAnswer(userAnswer, correctAnswer) {
  // Manejar casos donde no hay respuesta
  if (!userAnswer || !correctAnswer) {
    return false;
  }
  
  // Normalizar ambas respuestas para comparación robusta
  const userOption = String(userAnswer).toLowerCase().trim();
  const correctOption = String(correctAnswer).toLowerCase().trim();
  
  return userOption === correctOption;
}

/**
 * Validar múltiples respuestas y obtener estadísticas
 */
export function validateAnswers(questions, answers) {
  let correct = 0;
  const detailedResults = [];
  
  questions.forEach(question => {
    const userAnswer = answers[question.id];
    const isCorrect = validateAnswer(userAnswer, question.correcta);
    
    if (isCorrect) {
      correct++;
    }
    
    detailedResults.push({
      id: question.id,
      userAnswer: userAnswer || null,
      correctAnswer: question.correcta,
      isCorrect,
      pregunta: question.pregunta
    });
  });
  
  return {
    correct,
    total: questions.length,
    score: Math.round((correct / questions.length) * 100),
    detailedResults
  };
}

/**
 * Filtrar preguntas por tipo de respuesta
 */
export function filterQuestionsByAnswer(questions, answers, filterType) {
  switch (filterType) {
    case 'correct':
      return questions.filter(q => validateAnswer(answers[q.id], q.correcta));
    case 'incorrect':
      return questions.filter(q => {
        const hasAnswer = answers[q.id] !== undefined;
        return hasAnswer && !validateAnswer(answers[q.id], q.correcta);
      });
    case 'unanswered':
      return questions.filter(q => answers[q.id] === undefined);
    default:
      return questions;
  }
}