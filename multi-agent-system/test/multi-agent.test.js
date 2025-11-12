const assert = require('assert');

// Import agents and orchestrator
const AgentOrchestrator = require('../lib/AgentOrchestrator');
const ResearchAgent = require('../agents/ResearchAgent');
const ImplementationAgent = require('../agents/ImplementationAgent');
const VerificationAgent = require('../agents/VerificationAgent');
const MetaPromptOptimizer = require('../agents/MetaPromptOptimizer');
const PerformanceAuditor = require('../agents/PerformanceAuditor');
const AnomalyDetectionAgent = require('../agents/AnomalyDetectionAgent');
const UserInteractionAgent = require('../agents/UserInteractionAgent');

// Mock logger
const mockLogger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {}
};

console.log('Starting Multi-Agent System Tests...\n');

// Test 1: Agent Creation
console.log('Test 1: Agent Creation');
try {
  const researchAgent = new ResearchAgent(mockLogger);
  assert.strictEqual(researchAgent.name, 'ResearchAgent');
  assert.strictEqual(researchAgent.role, 'Planning and Information Gathering');
  assert.strictEqual(researchAgent.state, 'idle');
  console.log('✓ ResearchAgent created successfully');

  const implementationAgent = new ImplementationAgent(mockLogger);
  assert.strictEqual(implementationAgent.name, 'ImplementationAgent');
  console.log('✓ ImplementationAgent created successfully');

  const verificationAgent = new VerificationAgent(mockLogger);
  assert.strictEqual(verificationAgent.name, 'VerificationAgent');
  console.log('✓ VerificationAgent created successfully');

  const metaPromptOptimizer = new MetaPromptOptimizer(mockLogger);
  assert.strictEqual(metaPromptOptimizer.name, 'MetaPromptOptimizer');
  console.log('✓ MetaPromptOptimizer created successfully');

  const performanceAuditor = new PerformanceAuditor(mockLogger);
  assert.strictEqual(performanceAuditor.name, 'PerformanceAuditor');
  console.log('✓ PerformanceAuditor created successfully');

  const anomalyDetectionAgent = new AnomalyDetectionAgent(mockLogger);
  assert.strictEqual(anomalyDetectionAgent.name, 'AnomalyDetectionAgent');
  console.log('✓ AnomalyDetectionAgent created successfully');

  const userInteractionAgent = new UserInteractionAgent(mockLogger);
  assert.strictEqual(userInteractionAgent.name, 'UserInteractionAgent');
  console.log('✓ UserInteractionAgent created successfully\n');
} catch (error) {
  console.error('✗ Agent creation failed:', error.message);
  process.exit(1);
}

// Test 2: Orchestrator Setup
console.log('Test 2: Orchestrator Setup');
try {
  const orchestrator = new AgentOrchestrator(mockLogger);
  assert.strictEqual(orchestrator.agents.size, 0);
  console.log('✓ Orchestrator created successfully');

  const researchAgent = new ResearchAgent(mockLogger);
  orchestrator.registerAgent(researchAgent);
  assert.strictEqual(orchestrator.agents.size, 1);
  console.log('✓ Agent registered successfully\n');
} catch (error) {
  console.error('✗ Orchestrator setup failed:', error.message);
  process.exit(1);
}

// Test 3: ResearchAgent - Problem Decomposition
console.log('Test 3: ResearchAgent - Problem Decomposition');
(async () => {
  try {
    const researchAgent = new ResearchAgent(mockLogger);
    const result = await researchAgent.process({
      type: 'decompose',
      data: {
        problem: 'Build a scalable authentication system with high availability',
        context: { platform: 'web', scale: 'high' }
      }
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.agent, 'ResearchAgent');
    assert(result.data.complexity);
    assert(Array.isArray(result.data.components));
    assert(result.data.components.length > 0);
    console.log('✓ Problem decomposition successful');
    console.log(`  - Complexity: ${result.data.complexity.level}`);
    console.log(`  - Components: ${result.data.components.length}\n`);
  } catch (error) {
    console.error('✗ Problem decomposition failed:', error.message);
    process.exit(1);
  }

  // Test 4: ImplementationAgent - Solution Design
  console.log('Test 4: ImplementationAgent - Solution Design');
  try {
    const implementationAgent = new ImplementationAgent(mockLogger);
    const result = await implementationAgent.process({
      type: 'design',
      data: {
        component: { name: 'AuthService', id: 'auth-1' },
        requirements: { distributed: true, modular: true }
      }
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.agent, 'ImplementationAgent');
    assert(result.data.design);
    assert(result.data.design.architecture);
    console.log('✓ Solution design successful');
    console.log(`  - Architecture: ${result.data.design.architecture.pattern}\n`);
  } catch (error) {
    console.error('✗ Solution design failed:', error.message);
    process.exit(1);
  }

  // Test 5: VerificationAgent - Design Verification
  console.log('Test 5: VerificationAgent - Design Verification');
  try {
    const verificationAgent = new VerificationAgent(mockLogger);
    const result = await verificationAgent.process({
      type: 'verify-design',
      data: {
        design: {
          architecture: { pattern: 'microservices', layers: ['api', 'service', 'data'] },
          components: [{ name: 'AuthService' }],
          interfaces: [{ name: 'IAuthService' }],
          dataFlow: { input: 'request', output: 'response' },
          edgeCases: [{ case: 'timeout', handling: 'retry' }]
        },
        requirements: {}
      }
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.agent, 'VerificationAgent');
    assert(typeof result.data.verified === 'boolean');
    assert(Array.isArray(result.data.issues));
    console.log('✓ Design verification successful');
    console.log(`  - Verified: ${result.data.verified}`);
    console.log(`  - Issues found: ${result.data.issues.length}\n`);
  } catch (error) {
    console.error('✗ Design verification failed:', error.message);
    process.exit(1);
  }

  // Test 6: MetaPromptOptimizer - Prompt Analysis
  console.log('Test 6: MetaPromptOptimizer - Prompt Analysis');
  try {
    const metaPromptOptimizer = new MetaPromptOptimizer(mockLogger);
    const result = await metaPromptOptimizer.process({
      type: 'analyze-prompt',
      data: {
        prompt: 'Build a user authentication system with OAuth2 support for example Google and Facebook',
        outcome: { success: true },
        context: {}
      }
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.agent, 'MetaPromptOptimizer');
    assert(result.data.analysis);
    assert(result.data.analysis.clarity);
    assert(result.data.analysis.specificity);
    console.log('✓ Prompt analysis successful');
    console.log(`  - Clarity score: ${result.data.analysis.clarity.score}`);
    console.log(`  - Specificity score: ${result.data.analysis.specificity.score}\n`);
  } catch (error) {
    console.error('✗ Prompt analysis failed:', error.message);
    process.exit(1);
  }

  // Test 7: PerformanceAuditor - Performance Audit
  console.log('Test 7: PerformanceAuditor - Performance Audit');
  try {
    const performanceAuditor = new PerformanceAuditor(mockLogger);
    const result = await performanceAuditor.process({
      type: 'audit-performance',
      data: {
        solution: {},
        metrics: {
          responseTime: 800,
          cost: 0.5,
          accuracy: 96
        },
        targets: {
          responseTime: 1000,
          cost: 1.0,
          accuracy: 95
        }
      }
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.agent, 'PerformanceAuditor');
    assert(result.data.audit);
    assert(result.data.audit.speed);
    assert(result.data.audit.cost);
    console.log('✓ Performance audit successful');
    console.log(`  - Speed status: ${result.data.audit.speed.status}`);
    console.log(`  - Cost status: ${result.data.audit.cost.status}\n`);
  } catch (error) {
    console.error('✗ Performance audit failed:', error.message);
    process.exit(1);
  }

  // Test 8: AnomalyDetectionAgent - Anomaly Detection
  console.log('Test 8: AnomalyDetectionAgent - Anomaly Detection');
  try {
    const anomalyDetectionAgent = new AnomalyDetectionAgent(mockLogger);
    const result = await anomalyDetectionAgent.process({
      type: 'detect-anomalies',
      data: {
        workflowResults: [
          { step: 'step1', result: { success: true } },
          { step: 'step2', result: { success: true } }
        ],
        metrics: {
          responseTime: 1200,
          errorRate: 0.02,
          cpuUsage: 60
        }
      }
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.agent, 'AnomalyDetectionAgent');
    assert(typeof result.data.anomaliesDetected === 'number');
    assert(Array.isArray(result.data.anomalies));
    console.log('✓ Anomaly detection successful');
    console.log(`  - Anomalies detected: ${result.data.anomaliesDetected}`);
    console.log(`  - Severity: ${result.data.severity}\n`);
  } catch (error) {
    console.error('✗ Anomaly detection failed:', error.message);
    process.exit(1);
  }

  // Test 9: UserInteractionAgent - Request Clarification
  console.log('Test 9: UserInteractionAgent - Request Clarification');
  try {
    const userInteractionAgent = new UserInteractionAgent(mockLogger);
    const result = await userInteractionAgent.process({
      type: 'request-clarification',
      data: {
        ambiguities: [
          { type: 'requirement', topic: 'authentication method', priority: 'high' },
          { type: 'constraint', aspect: 'budget', priority: 'medium' }
        ],
        context: {},
        userId: 'user-123'
      }
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.agent, 'UserInteractionAgent');
    assert(Array.isArray(result.data.questions));
    assert.strictEqual(result.data.questions.length, 2);
    console.log('✓ Clarification request successful');
    console.log(`  - Questions generated: ${result.data.questions.length}\n`);
  } catch (error) {
    console.error('✗ Clarification request failed:', error.message);
    process.exit(1);
  }

  // Test 10: Agent Status
  console.log('Test 10: Agent Status');
  try {
    const researchAgent = new ResearchAgent(mockLogger);
    await researchAgent.process({
      type: 'decompose',
      data: { problem: 'Test problem', context: {} }
    });

    const status = researchAgent.getStatus();
    assert.strictEqual(status.name, 'ResearchAgent');
    assert(status.metrics);
    assert.strictEqual(status.metrics.tasksProcessed, 1);
    console.log('✓ Agent status retrieval successful');
    console.log(`  - Tasks processed: ${status.metrics.tasksProcessed}\n`);
  } catch (error) {
    console.error('✗ Agent status retrieval failed:', error.message);
    process.exit(1);
  }

  console.log('═══════════════════════════════════════');
  console.log('All tests passed successfully! ✓');
  console.log('═══════════════════════════════════════\n');
})();
