import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { question_id, is_invalid } = req.body;
      
      if (!question_id) {
        return res.status(400).json({ error: 'question_id is required' });
      }
      
      // Guardar información de pregunta inválida en KV
      // Usamos una clave especial para preguntas inválidas
      const invalidKey = `invalid:${question_id}`;
      
      if (is_invalid) {
        try {
          await kv.set(invalidKey, JSON.stringify({
            question_id,
            marked_invalid_at: new Date().toISOString(),
            is_invalid: true
          }));
          
          console.log(`🚫 Pregunta ${question_id} marcada como INVÁLIDA`);
        } catch (kvError) {
          console.log(`🚫 Pregunta ${question_id} marcada como INVÁLIDA (KV no disponible)`);
        }
      } else {
        try {
          await kv.del(invalidKey);
          console.log(`✅ Pregunta ${question_id} desmarcada como inválida`);
        } catch (kvError) {
          console.log(`✅ Pregunta ${question_id} desmarcada como inválida (KV no disponible)`);
        }
      }
      
      res.status(200).json({ 
        success: true, 
        question_id, 
        is_invalid,
        message: `Pregunta ${is_invalid ? 'marcada como inválida' : 'desmarcada como inválida'}`
      });
      
    } catch (error) {
      console.error('Error marking question as invalid:', error);
      res.status(500).json({ 
        error: 'Error marking question as invalid',
        details: error.message 
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}