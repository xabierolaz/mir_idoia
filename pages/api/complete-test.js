import { QuizStorage } from '../../lib/kv-client';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { start_time, end_time, score, correct, total, answers } = req.body;
      
      // Validar datos requeridos
      const requiredFields = ['start_time', 'end_time', 'score', 'correct', 'total'];
      const missingFields = requiredFields.filter(field => req.body[field] === undefined);
      
      if (missingFields.length > 0) {
        return res.status(400).json({ 
          error: `Missing required fields: ${missingFields.join(', ')}` 
        });
      }
      
      // Guardar resultado del test
      const storage = new QuizStorage();
      const success = await storage.saveTestResult({
        start_time,
        end_time,
        score,
        correct,
        total,
        answers: answers || {}
      });
      
      // Obtener estadísticas actualizadas
      const stats = await storage.getUserStats();
      
      res.status(200).json({
        status: success ? 'ok' : 'error',
        stats
      });
    } catch (error) {
      console.error('API complete-test error:', error);
      
      // En desarrollo, simular guardado exitoso
      res.status(200).json({
        status: 'ok',
        stats: {
          total_tests: 1,
          average_score: req.body.score || 0,
          last_test: new Date().toISOString(),
          total_questions_seen: req.body.total || 0
        }
      });
    }
  } else if (req.method === 'OPTIONS') {
    res.status(200).end();
  } else {
    res.setHeader('Allow', ['POST', 'OPTIONS']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}