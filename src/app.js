import express from 'express';
import config from './config/index.js';
import logger from './utils/logger.js';
import keywordService from './services/keywordService.js';
import sessionService from './services/sessionService.js';
import apiRoutes from './routes/api.js';

// Security middleware
import { 
  helmetMiddleware, 
  corsMiddleware, 
  rateLimiter,
  requestSizeLimiter 
} from './middleware/security.js';

// Error handling
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

/**
 * Create and configure Express application
 */
export const createApp = () => {
  const app = express();

  // Trust proxy (for getting real IP behind load balancer)
  app.set('trust proxy', 1);

  // Security middleware
  app.use(helmetMiddleware);
  app.use(corsMiddleware);
  app.use(rateLimiter);
  app.use(requestSizeLimiter('50kb'));

  // Body parsing
  app.use(express.json({ limit: '50kb' }));
  app.use(express.urlencoded({ extended: false, limit: '50kb' }));

  // API routes
  app.use('/', apiRoutes);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

/**
 * Start the server
 */
export const startServer = async () => {
  try {
    // Load keywords first
    await keywordService.loadKeywords();

    // Create app
    const app = createApp();

    // Start listening
    const server = app.listen(config.port, () => {
      logger.info(`🦞 Moltbook AI Verifier running on port ${config.port}`);
      logger.info(`   Environment: ${config.nodeEnv}`);
      logger.info(`   Keywords loaded: ${keywordService.getCount()}`);
      logger.info(`   Challenge timeout: ${config.challenge.timeoutSeconds}s`);
      logger.info('');
      logger.info('   Endpoints:');
      logger.info('   GET  /challenge - Get keyword challenge');
      logger.info('   POST /verify    - Submit post for verification');
      logger.info('   GET  /status    - Check status');
      logger.info('   GET  /help      - API docs');
      logger.info('   GET  /health    - Health check');
    });

    // Graceful shutdown
    const shutdown = (signal) => {
      logger.info(`${signal} received, shutting down gracefully...`);
      
      server.close(() => {
        logger.info('HTTP server closed');
        sessionService.shutdown();
        process.exit(0);
      });

      // Force exit after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

export default { createApp, startServer };
