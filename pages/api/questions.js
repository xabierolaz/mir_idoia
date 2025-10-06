import { QuizStorage } from '../../lib/kv-client';
import { selectWeightedQuestions } from '../../lib/quiz-logic';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Cargar datos dinámicamente para evitar problemas de build
      const questionsModule = await import('../../data/questions.json');
      const questionsData = questionsModule.default;
      
      // Obtener parámetros de query
      const { extra, replace, exclude } = req.query;
      const extraCount = parseInt(extra) || 0;
      const needReplacement = replace === '1';
      const excludeIds = exclude ? exclude.split(',').map(id => parseInt(id)) : [];
      
      // Obtener progreso actual del usuario
      const storage = new QuizStorage();
      const progress = await storage.getUserProgress();
      
      // Obtener configuración del usuario
      const config = await storage.getUserConfig();
      const numQuestions = config.questions_per_test || 100;
      
      if (needReplacement) {
        // Solicitud de una sola pregunta de reemplazo
        console.log(`🔄 Solicitando pregunta de reemplazo, excluyendo: [${excludeIds.join(', ')}]`);
        
        // Filtrar preguntas que no estén en la lista de exclusión
        const availableQuestions = questionsData.filter(q => !excludeIds.includes(q.id));
        
        if (availableQuestions.length === 0) {
          console.log('❌ No hay preguntas disponibles para reemplazo');
          return res.status(404).json({ error: 'No hay preguntas disponibles para reemplazo' });
        }
        
        // Seleccionar una pregunta con algoritmo de peso
        const replacementQuestions = selectWeightedQuestions(availableQuestions, progress, 1);
        
        if (replacementQuestions.length > 0) {
          console.log(`✅ Enviando pregunta de reemplazo: ID ${replacementQuestions[0].id}`);
          res.status(200).json(replacementQuestions[0]); // Devolver solo una pregunta
        } else {
          // Fallback: selección aleatoria
          const randomQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
          console.log(`✅ Enviando pregunta de reemplazo aleatoria: ID ${randomQuestion.id}`);
          res.status(200).json(randomQuestion);
        }
      } else if (extraCount > 0) {
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