import { QuizStorage } from '../../lib/kv-client';
import { selectWeightedQuestions } from '../../lib/quiz-logic';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Cargar datos dinámicamente para evitar problemas de build
      const questionsModule = await import('../../data/questions.json');
      const questionsData = questionsModule.default;
      
      // Obtener parámetros de query
      const { extra } = req.query;
      const extraCount = parseInt(extra) || 0;
      
      // Obtener progreso actual del usuario
      const storage = new QuizStorage();
      const progress = await storage.getUserProgress();
      
      // Obtener configuración del usuario
      const config = await storage.getUserConfig();
      const numQuestions = config.questions_per_test || 100;
      
      if (extraCount > 0) {
        // Solicitud de preguntas extra para compensar inválidas
        console.log(`📚 Solicitando ${extraCount} preguntas extra`);
        
        // Seleccionar preguntas extra aleatorias que no estén en uso
        const shuffled = [...questionsData].sort(() => Math.random() - 0.5);
        const extraQuestions = shuffled.slice(0, extraCount);
        
        console.log(`✅ Enviando ${extraQuestions.length} preguntas extra`);
        res.status(200).json(extraQuestions);
      } else {
        // Selección normal de preguntas con algoritmo de peso
        const selectedQuestions = selectWeightedQuestions(questionsData, progress, numQuestions);
        res.status(200).json(selectedQuestions);
      }
      
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