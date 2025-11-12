/**
 * BaseAgent - Abstract base class for all specialized agents
 * Provides common functionality for agent communication, state management, and logging
 */
class BaseAgent {
  constructor(name, role, logger) {
    if (new.target === BaseAgent) {
      throw new TypeError('Cannot instantiate abstract class BaseAgent directly');
    }
    
    this.name = name;
    this.role = role;
    this.logger = logger;
    this.state = 'idle';
    this.metrics = {
      tasksProcessed: 0,
      errors: 0,
      averageProcessingTime: 0
    };
    this.conversationHistory = [];
  }

  /**
   * Process a task - must be implemented by subclasses
   * @param {Object} task - The task to process
   * @returns {Promise<Object>} - The result of processing
   */
  async process(task) {
    throw new Error('process() must be implemented by subclass');
  }

  /**
   * Log agent activity with context
   */
  log(level, message, metadata = {}) {
    if (this.logger) {
      this.logger[level](message, {
        agent: this.name,
        role: this.role,
        state: this.state,
        ...metadata
      });
    }
  }

  /**
   * Update agent state
   */
  setState(newState) {
    const oldState = this.state;
    this.state = newState;
    this.log('info', `State transition: ${oldState} -> ${newState}`);
  }

  /**
   * Record a task in conversation history
   */
  recordTask(task, result, error = null) {
    this.conversationHistory.push({
      timestamp: new Date().toISOString(),
      task,
      result,
      error,
      state: this.state
    });
    
    // Keep only last 100 entries to prevent memory issues
    if (this.conversationHistory.length > 100) {
      this.conversationHistory.shift();
    }
  }

  /**
   * Update metrics
   */
  updateMetrics(processingTime, error = false) {
    this.metrics.tasksProcessed++;
    if (error) {
      this.metrics.errors++;
    }
    
    // Update average processing time
    const total = this.metrics.averageProcessingTime * (this.metrics.tasksProcessed - 1);
    this.metrics.averageProcessingTime = (total + processingTime) / this.metrics.tasksProcessed;
  }

  /**
   * Get agent status
   */
  getStatus() {
    return {
      name: this.name,
      role: this.role,
      state: this.state,
      metrics: this.metrics,
      historySize: this.conversationHistory.length
    };
  }

  /**
   * Reset agent state
   */
  reset() {
    this.state = 'idle';
    this.conversationHistory = [];
    this.log('info', 'Agent reset');
  }

  /**
   * Validate task input
   */
  validateTask(task) {
    if (!task || typeof task !== 'object') {
      throw new Error('Invalid task: must be an object');
    }
    
    if (!task.type) {
      throw new Error('Invalid task: missing type field');
    }
    
    if (!task.data) {
      throw new Error('Invalid task: missing data field');
    }
    
    return true;
  }

  /**
   * Handle errors gracefully
   */
  handleError(error, task) {
    this.log('error', `Error processing task: ${error.message}`, {
      error: error.stack,
      task
    });
    
    this.updateMetrics(0, true);
    this.setState('error');
    
    return {
      success: false,
      error: error.message,
      agent: this.name,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = BaseAgent;
