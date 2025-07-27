import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { sessionMiddleware } from './middleware/auth.js';
import { apiVersioningMiddleware } from './middleware/apiVersioning.js';
import { apiResponseMiddleware } from './middleware/apiResponse.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import characterRoutes from './routes/characters.js';
import encounterRoutes from './routes/encounters.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.client.url,
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(rateLimiter.global);

// API versioning and response formatting middleware
app.use(apiVersioningMiddleware);
app.use(apiResponseMiddleware);

// Session middleware for protected routes
app.use('/api', sessionMiddleware);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes - v1
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/characters', characterRoutes);
app.use('/api/v1/encounters', encounterRoutes);

// Error handling
app.use(errorHandler);

const PORT = config.server.port;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${config.env}`);
  console.log(`🔗 Client URL: ${config.client.url}`);
});

export default app;