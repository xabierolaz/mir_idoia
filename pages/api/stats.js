import { QuizStorage } from '../../lib/kv-client';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  try {
    const storage = new QuizStorage();
    const [stats, progress, history] = await Promise.all([
      storage.getUserStats(),
      storage.getUserProgress(),
      storage.getTestHistory(30)
    ]);

    res.status(200).json({ stats, progress, history });
  } catch (error) {
    console.error('API stats GET error:', error);
    res.status(500).json({ error: 'Failed to load statistics' });
  }
}
