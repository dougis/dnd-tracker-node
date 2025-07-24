import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pino } from 'pino';

const logger = pino();
const app = express();
const port = process.env.PORT ?? 3001;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Basic health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});

export default app;