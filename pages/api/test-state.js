import { QuizStorage } from '../../lib/kv-client';

export default async function handler(req, res) {
  const storage = new QuizStorage();

  if (req.method === 'GET') {
    try {
      const state = await storage.getTestState();
      res.status(200).json({ state });
    } catch (error) {
      console.error('API test-state GET error:', error);
      res.status(500).json({ error: 'Failed to load saved test state' });
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      const state = req.body;

      if (!state || !Array.isArray(state.questions) || state.questions.length === 0) {
        return res.status(400).json({ error: 'Test state requires at least one question' });
      }

      const payload = {
        ...state,
        updated_at: new Date().toISOString()
      };

      await storage.saveTestState(payload);
      res.status(200).json({ status: 'ok' });
    } catch (error) {
      console.error('API test-state POST error:', error);
      res.status(500).json({ error: 'Failed to persist test state' });
    }
    return;
  }

  if (req.method === 'DELETE') {
    try {
      await storage.clearTestState();
      res.status(200).json({ status: 'ok' });
    } catch (error) {
      console.error('API test-state DELETE error:', error);
      res.status(500).json({ error: 'Failed to clear test state' });
    }
    return;
  }

  res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
