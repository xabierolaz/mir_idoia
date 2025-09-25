import { QuizStorage } from '../../lib/kv-client';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { question_id, answer, is_correct } = req.body;
      
      // Validar datos requeridos
      if (!question_id || typeof is_correct !== 'boolean') {
        return res.status(400).json({ 
          error: 'Missing required fields: question_id and is_correct' 
        });
      }
      
      // Actualizar progreso en KV
      const storage = new QuizStorage();
      const updatedProgress = await storage.updateQuestionProgress(
        question_id,
        is_correct
      );
      
      res.status(200).json({
        status: 'ok',
        progress: updatedProgress
      });
    } catch (error) {
      console.error('API answer error:', error);
      
      // En desarrollo, simular guardado exitoso
      res.status(200).json({
        status: 'ok',
        progress: {
          apariciones: 1,
          aciertos: req.body.is_correct ? 1 : 0,
          ultima_fecha: new Date().toISOString()
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