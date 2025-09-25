import { QuizStorage } from '../../lib/kv-client';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const storage = new QuizStorage();
      const progress = await storage.getUserProgress();
      const stats = await storage.getUserStats();
      const config = await storage.getUserConfig();
      
      res.status(200).json({
        progress,
        stats,
        config,
        initialized: true
      });
    } catch (error) {
      console.error('API init error:', error);
      
      // En desarrollo o si KV no está disponible, devolver datos vacíos
      res.status(200).json({
        progress: {},
        stats: {
          total_tests: 0,
          average_score: 0,
          last_test: null,
          total_questions_seen: 0
        },
        config: {
          timer_enabled: true,
          timer_minutes: 120,
          show_feedback: true,
          show_statistics: true,
          questions_per_test: 100
        },
        initialized: true
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}