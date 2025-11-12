const express = require('express');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const winston = require('winston');
require('dotenv').config();

// Configure structured logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// State management class instead of mutable global
class OrchestratorState {
  constructor() {
    this.status = 'ready';
  }

  getStatus() {
    return this.status;
  }

  setStatus(newStatus) {
    if (['ready', 'paused'].includes(newStatus)) {
      this.status = newStatus;
      logger.info(`Status changed to: ${newStatus}`);
      return true;
    }
    return false;
  }

  isPaused() {
    return this.status === 'paused';
  }
}

const state = new OrchestratorState();

const app = express();
const PORT = process.env.PORT || 3000;

// Security headers
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:8080'],
  methods: ['GET', 'POST'],
  credentials: true,
  maxAge: 86400
};
app.use(cors(corsOptions));

// Compression
app.use(compression());

// Request size limits (100kb)
app.use(express.json({ limit: '100kb' }));

// Rate limiting - 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({ error: 'Too many requests, please try again later' });
  }
});
app.use(limiter);

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Connection timeout
app.use((req, res, next) => {
  req.setTimeout(30000); // 30 seconds
  res.setTimeout(30000);
  next();
});

// Health check endpoint
app.get('/status', (req, res) => {
  res.json({
    agent: 'orchestrator',
    status: state.getStatus(),
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Orchestrate endpoint with input validation
app.post('/orchestrate', (req, res, next) => {
  try {
    const { workflow = [], input = '' } = req.body;

    // Validate workflow is an array
    if (!Array.isArray(workflow)) {
      logger.warn('Invalid workflow format received');
      return res.status(400).json({ error: 'Invalid workflow format: must be an array' });
    }

    // Validate workflow array length (prevent DoS)
    if (workflow.length > 50) {
      logger.warn(`Workflow too long: ${workflow.length} steps`);
      return res.status(400).json({ error: 'Workflow too long: maximum 50 steps allowed' });
    }

    // Validate workflow content
    if (!workflow.every(step => typeof step === 'string' && step.length > 0 && step.length <= 100)) {
      logger.warn('Invalid workflow step format');
      return res.status(400).json({ error: 'Invalid workflow step: each step must be a non-empty string (max 100 chars)' });
    }

    // Validate input string length (prevent unbounded growth)
    if (typeof input !== 'string') {
      logger.warn('Invalid input type');
      return res.status(400).json({ error: 'Invalid input: must be a string' });
    }

    if (input.length > 10000) {
      logger.warn(`Input too long: ${input.length} characters`);
      return res.status(400).json({ error: 'Input too long: maximum 10000 characters allowed' });
    }

    // Check if paused
    if (state.isPaused()) {
      logger.info('Orchestration attempted while paused');
      return res.status(503).json({ error: 'Orchestrator is paused' });
    }

    // Process workflow
    let output = input;
    for (const step of workflow) {
      output = `Processed by ${step}: ${output}`;

      // Prevent unbounded string growth
      if (output.length > 50000) {
        logger.warn('Output exceeded maximum length');
        return res.status(413).json({ error: 'Output exceeded maximum length' });
      }
    }

    logger.info(`Orchestration completed: ${workflow.length} steps`);
    res.json({ result: output, steps: workflow.length });
  } catch (error) {
    next(error);
  }
});

// Pause endpoint
app.post('/pause', (req, res, next) => {
  try {
    if (state.setStatus('paused')) {
      logger.info('Orchestrator paused');
      res.json({ status: state.getStatus() });
    } else {
      res.status(400).json({ error: 'Failed to pause orchestrator' });
    }
  } catch (error) {
    next(error);
  }
});

// Resume endpoint
app.post('/resume', (req, res, next) => {
  try {
    if (state.setStatus('ready')) {
      logger.info('Orchestrator resumed');
      res.json({ status: state.getStatus() });
    } else {
      res.status(400).json({ error: 'Failed to resume orchestrator' });
    }
  } catch (error) {
    next(error);
  }
});

// 404 handler
app.use((req, res) => {
  logger.warn(`404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Not found' });
});

// Express error middleware
app.use((err, req, res, next) => {
  logger.error('Express error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// Global error handlers
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
  // Give time for logs to flush
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', { reason, promise });
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received, starting graceful shutdown`);

  server.close(() => {
    logger.info('HTTP server closed');

    // Close other resources here (database connections, etc.)

    logger.info('Graceful shutdown completed');
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Orchestrator Agent listening on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Set server timeout
server.timeout = 35000; // 35 seconds
server.keepAliveTimeout = 30000; // 30 seconds
server.headersTimeout = 31000; // 31 seconds
