import { QuizStorage } from '../../lib/kv-client';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  try {
    const storage = new QuizStorage();
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const history = await storage.getTestHistory(limit);
    res.status(200).json({ history });
  } catch (error) {
    console.error('API history GET error:', error);
    res.status(500).json({ error: 'Failed to load history' });
  }
}
