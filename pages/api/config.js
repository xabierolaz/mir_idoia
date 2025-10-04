import { QuizStorage } from '../../lib/kv-client';

export default async function handler(req, res) {
  const storage = new QuizStorage();

  if (req.method === 'GET') {
    try {
      const config = await storage.getUserConfig();
      res.status(200).json({ config });
    } catch (error) {
      console.error('API config GET error:', error);
      res.status(500).json({ error: 'Failed to load configuration' });
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      const updates = req.body || {};
      const allowedKeys = new Set([
        'timer_enabled',
        'timer_minutes',
        'show_feedback',
        'show_statistics',
        'questions_per_test'
      ]);

      const sanitized = {};
      for (const [key, value] of Object.entries(updates)) {
        if (!allowedKeys.has(key)) continue;

        switch (key) {
          case 'timer_enabled':
          case 'show_feedback':
          case 'show_statistics':
            sanitized[key] = Boolean(value);
            break;
          case 'timer_minutes':
            sanitized[key] = Math.min(Math.max(parseInt(value, 10) || 120, 30), 300);
            break;
          case 'questions_per_test':
            sanitized[key] = Math.min(Math.max(parseInt(value, 10) || 100, 10), 200);
            break;
          default:
            sanitized[key] = value;
        }
      }

      if (Object.keys(sanitized).length === 0) {
        return res.status(400).json({ error: 'No valid configuration fields provided' });
      }

      await storage.updateUserConfig(sanitized);
      const config = await storage.getUserConfig();

      res.status(200).json({ status: 'ok', config });
    } catch (error) {
      console.error('API config POST error:', error);
      res.status(500).json({ error: 'Failed to update configuration' });
    }
    return;
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
