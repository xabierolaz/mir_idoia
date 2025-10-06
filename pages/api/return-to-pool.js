import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { question_id } = req.body;
      
      if (!question_id) {
        return res.status(400).json({ error: 'question_id is required' });
      }
      
      try {
        // Remover de preguntas inválidas
        const invalidKey = `invalid:${question_id}`;
        await kv.del(invalidKey);
        
        // Remover de la lista de preguntas inválidas
        const invalidList = await kv.get('invalid_questions_list');
        const invalidIds = invalidList ? JSON.parse(invalidList) : [];
        const updatedInvalidIds = invalidIds.filter(id => id !== question_id.toString());
        await kv.set('invalid_questions_list', JSON.stringify(updatedInvalidIds));
        
        // Marcar como devuelta al pool
        const returnedKey = `returned:${question_id}`;
        await kv.set(returnedKey, JSON.stringify({
          question_id,
          returned_at: new Date().toISOString(),
          status: 'returned_to_pool'
        }));
        
        // Mantener lista de preguntas devueltas
        const returnedList = await kv.get('returned_questions_list');
        const returnedIds = returnedList ? JSON.parse(returnedList) : [];
        
        if (!returnedIds.includes(question_id.toString())) {
          returnedIds.push(question_id.toString());
          await kv.set('returned_questions_list', JSON.stringify(returnedIds));
        }
        
        console.log(`🔄 Pregunta ${question_id} devuelta al pool de preguntas`);
        
      } catch (kvError) {
        console.log(`🔄 Pregunta ${question_id} devuelta al pool (KV no disponible)`);
      }
      
      res.status(200).json({
        success: true,
        question_id,
        message: 'Pregunta devuelta al pool correctamente'
      });
      
    } catch (error) {
      console.error('Error returning question to pool:', error);
      res.status(500).json({
        error: 'Error devolviendo pregunta al pool',
        details: error.message
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}