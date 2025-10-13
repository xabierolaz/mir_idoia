import { QuizStorage } from '../../lib/kv-client';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const {
        start_time,
        end_time,
        score,
        correct,
        total,
        answers,
        duration,
        questions_replaced,
        replaced_question_ids
      } = req.body;

      // Validar datos requeridos
      const requiredFields = ['start_time', 'end_time', 'score', 'correct', 'total'];
      const missingFields = requiredFields.filter(field => req.body[field] === undefined);

      if (missingFields.length > 0) {
        return res.status(400).json({
          error: `Missing required fields: ${missingFields.join(', ')}`
        });
      }

      const storage = new QuizStorage();

      const success = await storage.saveTestResult({
        start_time,
        end_time,
        score,
        correct,
        total,
        duration,
        questions_replaced,
        replaced_question_ids,
        answers: answers || {}
      });

      if (!success) {
        return res.status(500).json({ error: 'Failed to persist test result' });
      }

      // Obtener estadísticas actualizadas
      const stats = await storage.getUserStats();

      res.status(200).json({
        status: 'ok',
        stats
      });
    } catch (error) {
      console.error('API complete-test error:', error);
      res.status(500).json({ error: 'Failed to persist test result' });
    }
  } else if (req.method === 'OPTIONS') {
    res.status(200).end();
  } else {
    res.setHeader('Allow', ['POST', 'OPTIONS']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}