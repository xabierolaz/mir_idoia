import { QuizStorage } from '../../lib/kv-client';
import { selectWeightedQuestions } from '../../lib/quiz-logic';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Cargar datos dinámicamente para evitar problemas de build
      const questionsModule = await import('../../data/questions.json');
      const questionsData = questionsModule.default;
      
      // Obtener progreso actual del usuario
      const storage = new QuizStorage();
      const progress = await storage.getUserProgress();
      
      // Obtener configuración del usuario
      const config = await storage.getUserConfig();
      const numQuestions = config.questions_per_test || 100;
      
      // Seleccionar preguntas con algoritmo de peso según configuración
      const selectedQuestions = selectWeightedQuestions(questionsData, progress, numQuestions);
      
      res.status(200).json(selectedQuestions);
    } catch (error) {
      console.error('API questions error:', error);
      
      try {
        // Fallback: cargar datos y hacer selección simple
        const questionsModule = await import('../../data/questions.json');
        const questionsData = questionsModule.default;
        const shuffled = [...questionsData].sort(() => Math.random() - 0.5);
        res.status(200).json(shuffled.slice(0, 100));
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
        res.status(500).json({ error: 'Error loading questions' });
      }
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}