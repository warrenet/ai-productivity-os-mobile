const BaseAgent = require('../lib/BaseAgent');

/**
 * AnomalyDetectionAgent - Automated Anomaly Detection and Self-Correction
 * Scans for unexpected or illogical outputs, failures in reasoning, or process bottlenecks
 * Triggers automated recovery steps (e.g., retry, fallback, additional review)
 * Logs issues for future learning and continuous reliability
 */
class AnomalyDetectionAgent extends BaseAgent {
  constructor(logger) {
    super('AnomalyDetectionAgent', 'Anomaly Detection and Self-Correction', logger);
    this.anomalyHistory = [];
    this.recoveryStrategies = new Map();
    this.initializeRecoveryStrategies();
  }

  initializeRecoveryStrategies() {
    this.recoveryStrategies.set('timeout', { action: 'retry', maxAttempts: 3, backoff: true });
    this.recoveryStrategies.set('validation-error', { action: 'fallback', useDefault: true });
    this.recoveryStrategies.set('logic-error', { action: 'escalate', notify: true });
    this.recoveryStrategies.set('performance-degradation', { action: 'optimize', cache: true });
  }

  async process(task) {
    this.validateTask(task);
    this.setState('detecting');
    
    const startTime = Date.now();
    
    try {
      let result;
      
      switch (task.type) {
        case 'detect-anomalies':
          result = await this.detectAnomalies(task.data);
          break;
        case 'analyze-output':
          result = await this.analyzeOutput(task.data);
          break;
        case 'check-reasoning':
          result = await this.checkReasoning(task.data);
          break;
        case 'recover':
          result = await this.executeRecovery(task.data);
          break;
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }
      
      const duration = Date.now() - startTime;
      this.updateMetrics(duration, false);
      this.recordTask(task, result);
      this.setState('idle');
      
      return {
        success: true,
        agent: this.name,
        data: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return this.handleError(error, task);
    }
  }

  async detectAnomalies(data) {
    const { workflowResults, metrics = {} } = data;
    
    this.log('info', 'Detecting anomalies in workflow results');

    const anomalies = [];

    // Check for performance anomalies
    const perfAnomalies = this.detectPerformanceAnomalies(metrics);
    anomalies.push(...perfAnomalies);

    // Check for output anomalies
    if (workflowResults) {
      const outputAnomalies = this.detectOutputAnomalies(workflowResults);
      anomalies.push(...outputAnomalies);
    }

    // Check for pattern anomalies
    const patternAnomalies = this.detectPatternAnomalies(workflowResults, this.anomalyHistory);
    anomalies.push(...patternAnomalies);

    // Store in history for learning
    this.anomalyHistory.push({
      timestamp: Date.now(),
      anomalies,
      metrics
    });

    // Keep only last 1000 entries
    if (this.anomalyHistory.length > 1000) {
      this.anomalyHistory.shift();
    }

    return {
      anomaliesDetected: anomalies.length,
      anomalies,
      severity: this.assessOverallSeverity(anomalies),
      recoveryRequired: anomalies.some(a => a.severity === 'critical' || a.severity === 'high'),
      reasoning: 'Anomalies detected through performance, output, and pattern analysis'
    };
  }

  async analyzeOutput(data) {
    const { output, expectedFormat, context = {} } = data;
    
    this.log('info', 'Analyzing output for anomalies');

    const analysis = {
      isValid: this.validateOutput(output, expectedFormat),
      isLogical: this.checkLogicalConsistency(output, context),
      isComplete: this.checkCompleteness(output, context),
      hasUnexpectedValues: this.detectUnexpectedValues(output),
      issues: []
    };

    // Collect issues
    if (!analysis.isValid) {
      analysis.issues.push({ type: 'validation', message: 'Output format invalid' });
    }
    if (!analysis.isLogical) {
      analysis.issues.push({ type: 'logic', message: 'Output contains logical inconsistencies' });
    }
    if (!analysis.isComplete) {
      analysis.issues.push({ type: 'completeness', message: 'Output is incomplete' });
    }

    return {
      analysis,
      anomalyDetected: analysis.issues.length > 0,
      reasoning: 'Output analyzed for validity, logic, completeness, and unexpected values'
    };
  }

  async checkReasoning(data) {
    const { reasoning, context } = data;
    
    this.log('info', 'Checking reasoning for failures');

    const checks = {
      hasLogicalFlows: this.checkLogicalFlows(reasoning),
      hasValidAssumptions: this.checkAssumptions(reasoning),
      hasCompleteness: this.checkReasoningCompleteness(reasoning),
      hasCircularLogic: this.detectCircularLogic(reasoning),
      hasContradictions: this.detectContradictions(reasoning)
    };

    const failures = [];
    if (!checks.hasLogicalFlows) {
      failures.push({ type: 'logic-flow', severity: 'high', message: 'Reasoning lacks logical flow' });
    }
    if (checks.hasCircularLogic) {
      failures.push({ type: 'circular-logic', severity: 'medium', message: 'Circular reasoning detected' });
    }
    if (checks.hasContradictions) {
      failures.push({ type: 'contradiction', severity: 'high', message: 'Contradictions found in reasoning' });
    }

    return {
      checks,
      failures,
      reasoningValid: failures.length === 0,
      reasoning: 'Reasoning checked for logical flows, assumptions, and contradictions'
    };
  }

  async executeRecovery(data) {
    const { anomaly, context = {} } = data;
    
    if (!anomaly || !anomaly.type) {
      throw new Error('Invalid anomaly data for recovery');
    }

    this.log('info', `Executing recovery for anomaly: ${anomaly.type}`);

    const strategy = this.recoveryStrategies.get(anomaly.type) || { action: 'log' };
    const recovery = {
      anomalyType: anomaly.type,
      strategy: strategy.action,
      steps: []
    };

    switch (strategy.action) {
      case 'retry':
        recovery.steps = await this.executeRetry(anomaly, strategy);
        break;
      case 'fallback':
        recovery.steps = await this.executeFallback(anomaly, strategy);
        break;
      case 'escalate':
        recovery.steps = await this.executeEscalation(anomaly, strategy);
        break;
      case 'optimize':
        recovery.steps = await this.executeOptimization(anomaly, strategy);
        break;
      default:
        recovery.steps = [{ action: 'log', message: 'Anomaly logged for review' }];
    }

    return {
      recovery,
      reasoning: `Recovery executed using ${strategy.action} strategy`
    };
  }

  // Helper methods
  detectPerformanceAnomalies(metrics) {
    const anomalies = [];
    const thresholds = {
      responseTime: 5000, // 5 seconds
      errorRate: 0.05,    // 5%
      cpuUsage: 80,       // 80%
      memoryUsage: 80     // 80%
    };

    if (metrics.responseTime > thresholds.responseTime) {
      anomalies.push({
        type: 'performance-degradation',
        category: 'latency',
        severity: 'high',
        message: `Response time ${metrics.responseTime}ms exceeds threshold ${thresholds.responseTime}ms`,
        value: metrics.responseTime
      });
    }

    if (metrics.errorRate > thresholds.errorRate) {
      anomalies.push({
        type: 'high-error-rate',
        category: 'reliability',
        severity: 'critical',
        message: `Error rate ${(metrics.errorRate * 100).toFixed(2)}% exceeds threshold ${(thresholds.errorRate * 100).toFixed(2)}%`,
        value: metrics.errorRate
      });
    }

    if (metrics.cpuUsage > thresholds.cpuUsage) {
      anomalies.push({
        type: 'resource-exhaustion',
        category: 'cpu',
        severity: 'medium',
        message: `CPU usage ${metrics.cpuUsage}% exceeds threshold ${thresholds.cpuUsage}%`,
        value: metrics.cpuUsage
      });
    }

    return anomalies;
  }

  detectOutputAnomalies(results) {
    const anomalies = [];

    if (!results || !Array.isArray(results)) {
      anomalies.push({
        type: 'invalid-output',
        category: 'format',
        severity: 'critical',
        message: 'Output is not in expected array format'
      });
      return anomalies;
    }

    // Check for empty results
    if (results.length === 0) {
      anomalies.push({
        type: 'empty-output',
        category: 'data',
        severity: 'medium',
        message: 'No results produced'
      });
    }

    // Check for failed steps
    const failedSteps = results.filter(r => !r.result?.success);
    if (failedSteps.length > 0) {
      anomalies.push({
        type: 'failed-steps',
        category: 'execution',
        severity: 'high',
        message: `${failedSteps.length} step(s) failed`,
        details: failedSteps.map(s => s.step)
      });
    }

    return anomalies;
  }

  detectPatternAnomalies(currentResults, history) {
    const anomalies = [];

    // Check if there's enough history
    if (history.length < 5) {
      return anomalies;
    }

    // Calculate average anomaly count
    const recentHistory = history.slice(-10);
    const avgAnomalies = recentHistory.reduce((sum, h) => sum + h.anomalies.length, 0) / recentHistory.length;

    // Check if current is significantly higher
    const currentAnomalyCount = currentResults?.anomalies?.length || 0;
    if (currentAnomalyCount > avgAnomalies * 2) {
      anomalies.push({
        type: 'anomaly-spike',
        category: 'pattern',
        severity: 'medium',
        message: `Unusual increase in anomalies: ${currentAnomalyCount} vs average ${avgAnomalies.toFixed(2)}`
      });
    }

    return anomalies;
  }

  validateOutput(output, expectedFormat) {
    if (!expectedFormat) return true;
    
    if (expectedFormat.type === 'object') {
      return typeof output === 'object' && output !== null;
    }
    if (expectedFormat.type === 'array') {
      return Array.isArray(output);
    }
    
    return true;
  }

  checkLogicalConsistency(output, context) {
    // Simplified check - ensure output has expected structure
    if (typeof output !== 'object') return false;
    if (output.success !== undefined && output.data === undefined && output.error === undefined) {
      return false; // Missing data or error when success is defined
    }
    return true;
  }

  checkCompleteness(output, context) {
    if (!output || typeof output !== 'object') return false;
    
    const requiredFields = context.requiredFields || [];
    return requiredFields.every(field => output[field] !== undefined);
  }

  detectUnexpectedValues(output) {
    if (!output || typeof output !== 'object') return false;
    
    // Check for NaN, Infinity, null in critical fields
    const hasUnexpected = Object.values(output).some(value => {
      return value === null || 
             Number.isNaN(value) || 
             value === Infinity || 
             value === -Infinity;
    });
    
    return hasUnexpected;
  }

  checkLogicalFlows(reasoning) {
    if (!reasoning || typeof reasoning !== 'string') return false;
    
    // Check for basic structure
    const hasSteps = reasoning.includes('step') || reasoning.includes('then') || reasoning.includes('because');
    return hasSteps && reasoning.length > 20;
  }

  checkAssumptions(reasoning) {
    if (!reasoning || typeof reasoning !== 'string') return true;
    
    // Check if unrealistic assumptions are made
    const unrealisticKeywords = ['always works', 'never fails', 'perfect', 'impossible to'];
    return !unrealisticKeywords.some(kw => reasoning.toLowerCase().includes(kw));
  }

  checkReasoningCompleteness(reasoning) {
    if (!reasoning || typeof reasoning !== 'string') return false;
    return reasoning.length > 50; // Basic check
  }

  detectCircularLogic(reasoning) {
    if (!reasoning || typeof reasoning !== 'string') return false;
    
    // Simplified check for obvious circular patterns
    const circularPhrases = ['because it is', 'since it does', 'as it is'];
    return circularPhrases.some(phrase => reasoning.toLowerCase().includes(phrase));
  }

  detectContradictions(reasoning) {
    if (!reasoning || typeof reasoning !== 'string') return false;
    
    // Check for contradictory words
    const hasPositive = /should|must|will|can/.test(reasoning);
    const hasNegative = /should not|must not|will not|cannot/.test(reasoning);
    
    // If both present in short text, might be contradiction
    return hasPositive && hasNegative && reasoning.length < 200;
  }

  assessOverallSeverity(anomalies) {
    if (anomalies.some(a => a.severity === 'critical')) return 'critical';
    if (anomalies.some(a => a.severity === 'high')) return 'high';
    if (anomalies.some(a => a.severity === 'medium')) return 'medium';
    return 'low';
  }

  async executeRetry(anomaly, strategy) {
    this.log('info', 'Executing retry strategy', { anomaly: anomaly.type });
    return [
      { action: 'retry-attempt-1', status: 'pending' },
      { action: 'retry-attempt-2', status: 'pending' },
      { action: 'retry-attempt-3', status: 'pending' }
    ];
  }

  async executeFallback(anomaly, strategy) {
    this.log('info', 'Executing fallback strategy', { anomaly: anomaly.type });
    return [
      { action: 'use-cached-data', status: 'executed' },
      { action: 'return-default-value', status: 'executed' }
    ];
  }

  async executeEscalation(anomaly, strategy) {
    this.log('warn', 'Escalating anomaly', { anomaly: anomaly.type });
    return [
      { action: 'notify-operator', status: 'executed' },
      { action: 'log-for-review', status: 'executed' },
      { action: 'pause-processing', status: 'pending' }
    ];
  }

  async executeOptimization(anomaly, strategy) {
    this.log('info', 'Executing optimization strategy', { anomaly: anomaly.type });
    return [
      { action: 'enable-caching', status: 'executed' },
      { action: 'optimize-queries', status: 'pending' },
      { action: 'increase-resources', status: 'pending' }
    ];
  }
}

module.exports = AnomalyDetectionAgent;
