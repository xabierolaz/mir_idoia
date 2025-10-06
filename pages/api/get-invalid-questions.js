import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Cargar todas las preguntas para hacer referencia cruzada
      const questionsModule = await import('../../data/questions.json');
      const allQuestions = questionsModule.default;
      
      // Obtener todas las claves de preguntas inválidas de KV
      let invalidQuestionIds = [];
      let invalidQuestionDetails = [];
      
      try {
        // Buscar todas las claves que empiecen con "invalid:"
        // Nota: Vercel KV no tiene scan, así que usaremos un enfoque diferente
        // Vamos a mantener una lista de IDs inválidos en una clave especial
        const invalidList = await kv.get('invalid_questions_list');
        invalidQuestionIds = invalidList ? JSON.parse(invalidList) : [];
        
        // Para cada ID inválido, obtener la información completa
        for (const questionId of invalidQuestionIds) {
          const invalidInfo = await kv.get(`invalid:${questionId}`);
          const questionData = allQuestions.find(q => q.id === parseInt(questionId));
          
          if (invalidInfo && questionData) {
            const parsedInvalidInfo = typeof invalidInfo === 'string' ? JSON.parse(invalidInfo) : invalidInfo;
            
            invalidQuestionDetails.push({
              ...questionData,
              invalidInfo: parsedInvalidInfo
            });
          }
        }
        
      } catch (kvError) {
        console.log('KV no disponible, retornando lista vacía');
        invalidQuestionDetails = [];
      }
      
      res.status(200).json({
        success: true,
        invalidQuestions: invalidQuestionDetails,
        count: invalidQuestionDetails.length
      });
      
    } catch (error) {
      console.error('Error getting invalid questions:', error);
      res.status(500).json({ 
        error: 'Error getting invalid questions',
        details: error.message 
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}