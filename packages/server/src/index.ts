import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { authRoutes } from './auth/routes';
import { encounterRoutes } from './encounters/routes';
import { validateProductionEnvironment } from './startup/checks';

const app = express();
const server = createServer(app);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true // Allow cookies to be sent
}));
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Encounter routes
app.use('/api/encounters', encounterRoutes);

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

// Production environment startup validation
async function startServer() {
  try {
    // Validate production environment before starting server
    const validationResult = await validateProductionEnvironment();
    
    if (!validationResult.success) {
      console.error('💥 Production environment validation failed. Server cannot start.');
      
      // Log failed checks
      validationResult.checks.forEach(check => {
        if (!check.success) {
          console.error(`❌ ${check.name}: ${check.message}`);
        }
      });
      
      process.exit(1);
    }

    // Start server if validation passes
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      
      if (process.env.NODE_ENV === 'production') {
        console.log('✅ Production environment validation completed successfully');
      }
    });
  } catch (error) {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { app, server };