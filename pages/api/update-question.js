import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { question_id, pregunta, opciones, correcta } = req.body;
      
      if (!question_id || !pregunta || !opciones || !correcta) {
        return res.status(400).json({ 
          error: 'Faltan campos requeridos: question_id, pregunta, opciones, correcta' 
        });
      }
      
      // Validar que la respuesta correcta esté en las opciones
      if (!opciones[correcta]) {
        return res.status(400).json({
          error: `La respuesta correcta '${correcta}' no existe en las opciones`
        });
      }
      
      // Crear objeto de pregunta corregida
      const correctedQuestion = {
        id: parseInt(question_id),
        pregunta: pregunta.trim(),
        opciones: {
          a: opciones.a?.trim(),
          b: opciones.b?.trim(),
          c: opciones.c?.trim(),
          d: opciones.d?.trim()
        },
        correcta: correcta.toLowerCase(),
        corrected_at: new Date().toISOString(),
        original_id: question_id
      };
      
      try {
        // Guardar pregunta corregida en KV
        const correctedKey = `corrected:${question_id}`;
        await kv.set(correctedKey, JSON.stringify(correctedQuestion));
        
        // Mantener lista de preguntas corregidas
        const correctedList = await kv.get('corrected_questions_list');
        const correctedIds = correctedList ? JSON.parse(correctedList) : [];
        
        if (!correctedIds.includes(question_id.toString())) {
          correctedIds.push(question_id.toString());
          await kv.set('corrected_questions_list', JSON.stringify(correctedIds));
        }
        
        console.log(`✏️ Pregunta ${question_id} corregida y guardada`);
        
      } catch (kvError) {
        console.log(`✏️ Pregunta ${question_id} corregida (KV no disponible)`);
      }
      
      res.status(200).json({
        success: true,
        question_id,
        correctedQuestion,
        message: 'Pregunta corregida correctamente'
      });
      
    } catch (error) {
      console.error('Error updating question:', error);
      res.status(500).json({
        error: 'Error actualizando pregunta',
        details: error.message
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}