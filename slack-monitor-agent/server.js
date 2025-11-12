const express = require('express');
const body = require('body-parser');
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
class SlackMonitorState {
  constructor() {
    this.paused = false;
    this.eventsReceived = 0;
    this.triggersDetected = 0;
  }

  isPaused() {
    return this.paused;
  }

  setPaused(paused) {
    this.paused = paused;
    logger.info(`Monitor ${paused ? 'paused' : 'resumed'}`);
  }

  getStatus() {
    return this.paused ? 'paused' : 'active';
  }

  incrementEvents() {
    this.eventsReceived++;
  }

  incrementTriggers() {
    this.triggersDetected++;
  }

  getStats() {
    return {
      eventsReceived: this.eventsReceived,
      triggersDetected: this.triggersDetected
    };
  }
}

const state = new SlackMonitorState();

const app = express();

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
app.use(body.json({ limit: '100kb' }));

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

// Status endpoint
app.get('/status', (req, res) => {
  const stats = state.getStats();
  res.json({
    agent: 'slack-monitor',
    status: state.getStatus(),
    uptime: process.uptime(),
    eventsReceived: stats.eventsReceived,
    triggersDetected: stats.triggersDetected,
    timestamp: new Date().toISOString()
  });
});

// Slack event endpoint
app.post('/slack-event', (req, res, next) => {
  try {
    state.incrementEvents();

    // Check if paused
    if (state.isPaused()) {
      logger.info('Slack event received while paused');
      return res.status(200).send('Agent paused');
    }

    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      logger.warn('Invalid request body');
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const event = req.body.event || {};
    const kw = process.env.TRIGGER_KEYWORD || '#deploy';

    // Validate event text
    if (event.text && typeof event.text === 'string') {
      // Input length validation
      if (event.text.length > 10000) {
        logger.warn(`Event text too long: ${event.text.length} characters`);
        return res.status(400).json({ error: 'Event text too long' });
      }

      // Check for trigger keyword
      if (event.text.includes(kw)) {
        state.incrementTriggers();
        logger.info('Trigger detected:', {
          keyword: kw,
          text: event.text.substring(0, 100) // Log only first 100 chars
        });
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    next(error);
  }
});

// Pause endpoint
app.post('/pause', (req, res, next) => {
  try {
    state.setPaused(true);
    logger.info('Slack Monitor paused');
    res.json({ status: state.getStatus() });
  } catch (error) {
    next(error);
  }
});

// Resume endpoint
app.post('/resume', (req, res, next) => {
  try {
    state.setPaused(false);
    logger.info('Slack Monitor resumed');
    res.json({ status: state.getStatus() });
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
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  logger.info(`Slack Monitor listening on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Trigger keyword: ${process.env.TRIGGER_KEYWORD || '#deploy'}`);
});

// Set server timeout
server.timeout = 35000; // 35 seconds
server.keepAliveTimeout = 30000; // 30 seconds
server.headersTimeout = 31000; // 31 seconds
