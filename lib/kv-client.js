import { kv } from '@vercel/kv';

export class QuizStorage {
  async getUserProgress() {
    try {
      const progress = await kv.hgetall('user:progress') || {};
      // Convertir strings JSON a objetos si es necesario
      const parsedProgress = {};
      for (const [key, value] of Object.entries(progress)) {
        try {
          parsedProgress[key] = typeof value === 'string' ? JSON.parse(value) : value;
        } catch {
          parsedProgress[key] = value;
        }
      }
      return parsedProgress;
    } catch (error) {
      console.error('Error getting user progress:', error);
      return {};
    }
  }

  async updateQuestionProgress(questionId, isCorrect) {
    const key = `q:${questionId}`;
    
    try {
      // Obtener progreso actual
      let current = await kv.hget('user:progress', key);
      
      if (typeof current === 'string') {
        try {
          current = JSON.parse(current);
        } catch {
          current = null;
        }
      }
      
      if (!current) {
        current = { apariciones: 0, aciertos: 0 };
      }
      
      // Actualizar estadísticas
      current.apariciones = (current.apariciones || 0) + 1;
      if (isCorrect) {
        current.aciertos = (current.aciertos || 0) + 1;
      }
      current.ultima_fecha = new Date().toISOString();
      
      // Guardar en KV
      await kv.hset('user:progress', key, JSON.stringify(current));
      
      return current;
    } catch (error) {
      console.error('Error updating question progress:', error);
      return { apariciones: 1, aciertos: isCorrect ? 1 : 0 };
    }
  }

  async saveTestResult(testData) {
    try {
      const testId = `test:${new Date().toISOString()}`;
      
      // Guardar resultado del test
      await kv.hset('user:tests', testId, JSON.stringify(testData));
      
      // Actualizar estadísticas
      await kv.hincrby('user:stats', 'total_tests', 1);
      await kv.hset('user:stats', 'last_test', new Date().toISOString());
      
      // Actualizar promedio de puntuación
      const stats = await this.getUserStats();
      const totalTests = stats.total_tests || 1;
      const currentAvg = parseFloat(stats.average_score || 0);
      const newAvg = ((currentAvg * (totalTests - 1)) + testData.score) / totalTests;
      
      await kv.hset('user:stats', 'average_score', newAvg.toFixed(2));
      
      return true;
    } catch (error) {
      console.error('Error saving test result:', error);
      return false;
    }
  }

  async getUserStats() {
    try {
      const stats = await kv.hgetall('user:stats') || {};
      
      return {
        total_tests: parseInt(stats.total_tests || 0),
        average_score: parseFloat(stats.average_score || 0),
        last_test: stats.last_test || null,
        total_questions_seen: parseInt(stats.total_questions_seen || 0)
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        total_tests: 0,
        average_score: 0,
        last_test: null,
        total_questions_seen: 0
      };
    }
  }

  async saveTestState(state) {
    try {
      await kv.set('user:current_test', JSON.stringify(state));
      return true;
    } catch (error) {
      console.error('Error saving test state:', error);
      return false;
    }
  }

  async getTestState() {
    try {
      const state = await kv.get('user:current_test');
      return state ? JSON.parse(state) : null;
    } catch (error) {
      console.error('Error getting test state:', error);
      return null;
    }
  }

  async clearTestState() {
    try {
      await kv.del('user:current_test');
      return true;
    } catch (error) {
      console.error('Error clearing test state:', error);
      return false;
    }
  }

  async getUserConfig() {
    try {
      const config = await kv.hgetall('user:config') || {};
      return {
        timer_enabled: config.timer_enabled !== 'false',
        timer_minutes: parseInt(config.timer_minutes || 120),
        show_feedback: config.show_feedback !== 'false',
        show_statistics: config.show_statistics !== 'false',
        questions_per_test: parseInt(config.questions_per_test || 100),
        ...config
      };
    } catch (error) {
      console.error('Error getting user config:', error);
      return {
        timer_enabled: true,
        timer_minutes: 120,
        show_feedback: true,
        show_statistics: true,
        questions_per_test: 100
      };
    }
  }

  async updateUserConfig(updates) {
    try {
      for (const [key, value] of Object.entries(updates)) {
        await kv.hset('user:config', key, value.toString());
      }
      return true;
    } catch (error) {
      console.error('Error updating user config:', error);
      return false;
    }
  }

  async getTestHistory(limit = 20) {
    try {
      const tests = await kv.hgetall('user:tests') || {};
      const testArray = Object.entries(tests).map(([id, data]) => {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        return { id, ...parsed };
      });
      
      // Ordenar por fecha descendente
      testArray.sort((a, b) => new Date(b.end_time || b.start_time) - new Date(a.end_time || a.start_time));
      
      return testArray.slice(0, limit);
    } catch (error) {
      console.error('Error getting test history:', error);
      return [];
    }
  }
}