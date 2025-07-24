import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from './index';

describe('Server configuration', () => {
  it('should respond to health check', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
  });

  it('should respond to test API endpoint', async () => {
    const response = await request(app)
      .get('/api/test')
      .expect(200);

    expect(response.body).toHaveProperty('message', 'Server is running!');
  });

  it('should handle JSON requests', async () => {
    const response = await request(app)
      .post('/api/test')
      .send({ test: 'data' })
      .expect(404); // Since we haven't defined POST yet

    // This tests that Express can parse JSON
  });
});