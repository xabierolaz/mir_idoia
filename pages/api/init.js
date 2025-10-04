import { QuizStorage } from '../../lib/kv-client';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const storage = new QuizStorage();
      const [progress, stats, config, savedState] = await Promise.all([
        storage.getUserProgress(),
        storage.getUserStats(),
        storage.getUserConfig(),
        storage.getTestState()
      ]);

      const hasSavedTest = Boolean(
        savedState &&
        Array.isArray(savedState.questions) &&
        savedState.questions.length > 0
      );

      res.status(200).json({
        progress,
        stats,
        config,
        has_saved_test: hasSavedTest,
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
