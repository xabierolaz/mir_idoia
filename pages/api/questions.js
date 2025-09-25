import { QuizStorage } from '../../lib/kv-client';
import { selectWeightedQuestions } from '../../lib/quiz-logic';
import questionsData from '../../data/questions.json';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Obtener progreso actual del usuario
      const storage = new QuizStorage();
      const progress = await storage.getUserProgress();
      
      // Seleccionar 100 preguntas con algoritmo de peso
      const selectedQuestions = selectWeightedQuestions(questionsData, progress, 100);
      
      res.status(200).json(selectedQuestions);
    } catch (error) {
      console.error('API questions error:', error);
      
      // Si hay error, devolver selección aleatoria simple
      const shuffled = [...questionsData].sort(() => Math.random() - 0.5);
      res.status(200).json(shuffled.slice(0, 100));
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}