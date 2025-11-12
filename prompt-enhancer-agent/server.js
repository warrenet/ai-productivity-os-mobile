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
class EnhancerState {
  constructor() {
    this.status = 'running';
    this.processedCount = 0;
  }

  getStatus() {
    return this.status;
  }

  setStatus(newStatus) {
    if (['running', 'paused'].includes(newStatus)) {
      this.status = newStatus;
      logger.info(`Status changed to: ${newStatus}`);
      return true;
    }
    return false;
  }

  isPaused() {
    return this.status === 'paused';
  }

  incrementProcessed() {
    this.processedCount++;
  }

  getProcessedCount() {
    return this.processedCount;
  }
}

const state = new EnhancerState();

// Pre-compiled regex patterns for better performance
const REGEX_PATTERNS = {
  whitespace: /\s+/g,
  asap: /\bASAP\b/gi,
  fyi: /\bFYI\b/gi,
  eta: /\bETA\b/gi
};

// Optimized prompt enhancement with pre-compiled regexes
function enhancePrompt(prompt = '') {
  // Input validation
  if (typeof prompt !== 'string') {
    throw new TypeError('Prompt must be a string');
  }

  // Input length validation (prevent DoS)
  if (prompt.length > 5000) {
    throw new Error('Prompt too long: maximum 5000 characters allowed');
  }

  // Single-pass replacement using pre-compiled regexes
  let enhanced = prompt.trim().replace(REGEX_PATTERNS.whitespace, ' ');

  // Chain replacements efficiently
  enhanced = enhanced
    .replace(REGEX_PATTERNS.asap, 'as soon as possible')
    .replace(REGEX_PATTERNS.fyi, 'for your information')
    .replace(REGEX_PATTERNS.eta, 'estimated time of arrival');

  return `Enhanced Prompt: ${enhanced}`;
}

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

// Enhance endpoint
app.post('/enhance', (req, res, next) => {
  try {
    // Check if paused
    if (state.isPaused()) {
      logger.info('Enhancement attempted while paused');
      return res.status(503).json({ error: 'Prompt Enhancer is paused' });
    }

    const { prompt } = req.body;

    // Validate prompt exists
    if (prompt === undefined || prompt === null) {
      logger.warn('Missing prompt in request');
      return res.status(400).json({ error: 'Missing prompt field' });
    }

    // Enhance the prompt
    const result = enhancePrompt(prompt);

    state.incrementProcessed();
    logger.info('Prompt enhanced successfully', {
      inputLength: prompt.length,
      outputLength: result.length
    });

    res.json({
      result,
      originalLength: prompt.length,
      enhancedLength: result.length
    });
  } catch (error) {
    if (error instanceof TypeError || error.message.includes('too long')) {
      logger.warn('Validation error:', { error: error.message });
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});

// Status endpoint
app.get('/status', (req, res) => {
  res.json({
    agent: 'prompt-enhancer',
    status: state.getStatus(),
    uptime: process.uptime(),
    processed: state.getProcessedCount(),
    timestamp: new Date().toISOString()
  });
});

// Pause endpoint
app.post('/pause', (req, res, next) => {
  try {
    if (state.setStatus('paused')) {
      logger.info('Prompt Enhancer paused');
      res.json({ status: state.getStatus() });
    } else {
      res.status(400).json({ error: 'Failed to pause enhancer' });
    }
  } catch (error) {
    next(error);
  }
});

// Resume endpoint
app.post('/resume', (req, res, next) => {
  try {
    if (state.setStatus('running')) {
      logger.info('Prompt Enhancer resumed');
      res.json({ status: state.getStatus() });
    } else {
      res.status(400).json({ error: 'Failed to resume enhancer' });
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
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  logger.info(`Prompt Enhancer listening on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Set server timeout
server.timeout = 35000; // 35 seconds
server.keepAliveTimeout = 30000; // 30 seconds
server.headersTimeout = 31000; // 31 seconds
