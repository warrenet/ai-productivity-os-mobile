const express = require('express');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const winston = require('winston');
require('dotenv').config();

// Import agents and orchestrator
const AgentOrchestrator = require('./lib/AgentOrchestrator');
const ResearchAgent = require('./agents/ResearchAgent');
const ImplementationAgent = require('./agents/ImplementationAgent');
const VerificationAgent = require('./agents/VerificationAgent');
const MetaPromptOptimizer = require('./agents/MetaPromptOptimizer');
const PerformanceAuditor = require('./agents/PerformanceAuditor');
const AnomalyDetectionAgent = require('./agents/AnomalyDetectionAgent');
const UserInteractionAgent = require('./agents/UserInteractionAgent');

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

// Initialize orchestrator and agents
const orchestrator = new AgentOrchestrator(logger);

// Create and register all agents
const researchAgent = new ResearchAgent(logger);
const implementationAgent = new ImplementationAgent(logger);
const verificationAgent = new VerificationAgent(logger);
const metaPromptOptimizer = new MetaPromptOptimizer(logger);
const performanceAuditor = new PerformanceAuditor(logger);
const anomalyDetectionAgent = new AnomalyDetectionAgent(logger);
const userInteractionAgent = new UserInteractionAgent(logger);

orchestrator.registerAgent(researchAgent);
orchestrator.registerAgent(implementationAgent);
orchestrator.registerAgent(verificationAgent);
orchestrator.registerAgent(metaPromptOptimizer);
orchestrator.registerAgent(performanceAuditor);
orchestrator.registerAgent(anomalyDetectionAgent);
orchestrator.registerAgent(userInteractionAgent);

// Register standard workflows
orchestrator.registerWorkflow('complete-solution', {
  name: 'complete-solution',
  steps: [
    { name: 'research-and-plan', agentName: 'ResearchAgent', config: {}, retries: 2, escalateOnFailure: false },
    { name: 'design-solution', agentName: 'ImplementationAgent', config: {}, retries: 2, escalateOnFailure: false },
    { name: 'verify-design', agentName: 'VerificationAgent', config: {}, retries: 1, escalateOnFailure: true },
    { name: 'implement-solution', agentName: 'ImplementationAgent', config: {}, retries: 2, escalateOnFailure: false },
    { name: 'verify-implementation', agentName: 'VerificationAgent', config: {}, retries: 1, escalateOnFailure: true },
    { name: 'audit-performance', agentName: 'PerformanceAuditor', config: {}, retries: 1, escalateOnFailure: false },
    { name: 'detect-anomalies', agentName: 'AnomalyDetectionAgent', config: {}, retries: 1, escalateOnFailure: true }
  ],
  escalationHandler: 'UserInteractionAgent'
});

orchestrator.registerWorkflow('iterative-refinement', {
  name: 'iterative-refinement',
  steps: [
    { name: 'analyze-prompt', agentName: 'MetaPromptOptimizer', config: {}, retries: 1, escalateOnFailure: false },
    { name: 'optimize-prompt', agentName: 'MetaPromptOptimizer', config: {}, retries: 1, escalateOnFailure: false },
    { name: 'research-improved', agentName: 'ResearchAgent', config: {}, retries: 2, escalateOnFailure: false },
    { name: 'implement-improved', agentName: 'ImplementationAgent', config: {}, retries: 2, escalateOnFailure: false },
    { name: 'verify-improved', agentName: 'VerificationAgent', config: {}, retries: 1, escalateOnFailure: true },
    { name: 'audit-improvements', agentName: 'PerformanceAuditor', config: {}, retries: 1, escalateOnFailure: false }
  ],
  escalationHandler: 'UserInteractionAgent'
});

orchestrator.registerWorkflow('quality-assurance', {
  name: 'quality-assurance',
  steps: [
    { name: 'verify-logic', agentName: 'VerificationAgent', config: {}, retries: 1, escalateOnFailure: false },
    { name: 'verify-implementation', agentName: 'VerificationAgent', config: {}, retries: 1, escalateOnFailure: true },
    { name: 'assess-quality', agentName: 'VerificationAgent', config: {}, retries: 1, escalateOnFailure: false },
    { name: 'detect-anomalies', agentName: 'AnomalyDetectionAgent', config: {}, retries: 1, escalateOnFailure: false },
    { name: 'audit-performance', agentName: 'PerformanceAuditor', config: {}, retries: 1, escalateOnFailure: false },
    { name: 'audit-ethics', agentName: 'PerformanceAuditor', config: {}, retries: 1, escalateOnFailure: true }
  ],
  escalationHandler: 'UserInteractionAgent'
});

const app = express();
const PORT = process.env.PORT || 3003;

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

// Request size limits
app.use(express.json({ limit: '1mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
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

// Health check endpoint
app.get('/status', (req, res) => {
  const status = orchestrator.getStatus();
  res.json({
    service: 'multi-agent-system',
    status: 'operational',
    ...status,
    timestamp: new Date().toISOString()
  });
});

// Execute workflow endpoint
app.post('/workflow/execute', async (req, res, next) => {
  try {
    const { workflowName, task } = req.body;

    if (!workflowName) {
      return res.status(400).json({ error: 'Workflow name is required' });
    }

    if (!task || typeof task !== 'object') {
      return res.status(400).json({ error: 'Task object is required' });
    }

    logger.info('Executing workflow', { workflowName, task });

    const result = await orchestrator.executeWorkflow(workflowName, task);

    res.json({
      success: true,
      workflow: workflowName,
      result
    });
  } catch (error) {
    next(error);
  }
});

// Direct agent execution endpoint
app.post('/agent/execute', async (req, res, next) => {
  try {
    const { agentName, task } = req.body;

    if (!agentName) {
      return res.status(400).json({ error: 'Agent name is required' });
    }

    if (!task || typeof task !== 'object') {
      return res.status(400).json({ error: 'Task object is required' });
    }

    const agent = orchestrator.agents.get(agentName);
    if (!agent) {
      return res.status(404).json({ error: `Agent not found: ${agentName}` });
    }

    logger.info('Executing agent task', { agentName, taskType: task.type });

    const result = await agent.process(task);

    res.json({
      success: result.success,
      agent: agentName,
      result
    });
  } catch (error) {
    next(error);
  }
});

// Get agent status
app.get('/agent/:agentName/status', (req, res) => {
  const { agentName } = req.params;
  const agent = orchestrator.agents.get(agentName);

  if (!agent) {
    return res.status(404).json({ error: `Agent not found: ${agentName}` });
  }

  res.json(agent.getStatus());
});

// List available workflows
app.get('/workflows', (req, res) => {
  const workflows = Array.from(orchestrator.workflows.keys());
  res.json({
    workflows,
    count: workflows.length
  });
});

// List available agents
app.get('/agents', (req, res) => {
  const agents = Array.from(orchestrator.agents.values()).map(agent => ({
    name: agent.name,
    role: agent.role,
    state: agent.state
  }));

  res.json({
    agents,
    count: agents.length
  });
});

// 404 handler
app.use((req, res) => {
  logger.warn(`404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Not found' });
});

// Error middleware
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
    logger.info('Graceful shutdown completed');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Multi-Agent System listening on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Registered agents: ${orchestrator.agents.size}`);
  logger.info(`Registered workflows: ${orchestrator.workflows.size}`);
});

server.timeout = 35000;
server.keepAliveTimeout = 30000;
server.headersTimeout = 31000;
