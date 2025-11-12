/**
 * AgentOrchestrator - Manages multi-agent collaboration and workflow execution
 * Handles agent coordination, escalation, and iterative refinement
 */
class AgentOrchestrator {
  constructor(logger) {
    this.logger = logger;
    this.agents = new Map();
    this.workflows = new Map();
    this.activeTasksCount = 0;
    this.maxConcurrentTasks = 10;
  }

  /**
   * Register an agent with the orchestrator
   */
  registerAgent(agent) {
    if (this.agents.has(agent.name)) {
      throw new Error(`Agent ${agent.name} is already registered`);
    }
    
    this.agents.set(agent.name, agent);
    this.log('info', `Agent registered: ${agent.name} (${agent.role})`);
  }

  /**
   * Register a workflow
   */
  registerWorkflow(name, workflow) {
    this.workflows.set(name, workflow);
    this.log('info', `Workflow registered: ${name}`);
  }

  /**
   * Execute a multi-agent workflow
   */
  async executeWorkflow(workflowName, initialTask) {
    const workflow = this.workflows.get(workflowName);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowName}`);
    }

    this.log('info', `Executing workflow: ${workflowName}`, { task: initialTask });

    if (this.activeTasksCount >= this.maxConcurrentTasks) {
      throw new Error('Maximum concurrent tasks reached');
    }

    this.activeTasksCount++;

    try {
      let currentTask = initialTask;
      const results = [];
      const startTime = Date.now();

      for (const step of workflow.steps) {
        const agent = this.agents.get(step.agentName);
        if (!agent) {
          throw new Error(`Agent not found: ${step.agentName}`);
        }

        this.log('info', `Executing step: ${step.name} with agent: ${step.agentName}`);

        // Execute agent with retry logic
        const stepResult = await this.executeWithRetry(
          agent,
          { ...currentTask, stepName: step.name, stepConfig: step.config },
          step.retries || 1
        );

        results.push({
          step: step.name,
          agent: step.agentName,
          result: stepResult
        });

        // Check if we need to escalate or continue
        if (!stepResult.success && step.escalateOnFailure) {
          this.log('warn', `Step failed, escalating: ${step.name}`);
          return this.handleEscalation(workflow, step, stepResult, results);
        }

        // Pass output to next step
        if (stepResult.data) {
          currentTask = { ...currentTask, data: stepResult.data };
        }
      }

      const duration = Date.now() - startTime;
      this.log('info', `Workflow completed: ${workflowName}`, { duration, stepsCompleted: results.length });

      return {
        success: true,
        workflow: workflowName,
        results,
        duration,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.log('error', `Workflow execution failed: ${workflowName}`, { error: error.message });
      throw error;
    } finally {
      this.activeTasksCount--;
    }
  }

  /**
   * Execute agent task with retry logic
   */
  async executeWithRetry(agent, task, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const startTime = Date.now();
        const result = await agent.process(task);
        const duration = Date.now() - startTime;
        
        agent.updateMetrics(duration, false);
        
        return result;
      } catch (error) {
        lastError = error;
        this.log('warn', `Agent task failed, attempt ${attempt}/${maxRetries}`, {
          agent: agent.name,
          error: error.message
        });
        
        if (attempt < maxRetries) {
          // Exponential backoff
          await this.sleep(Math.pow(2, attempt) * 100);
        }
      }
    }
    
    agent.updateMetrics(0, true);
    throw lastError;
  }

  /**
   * Handle workflow escalation
   */
  async handleEscalation(workflow, failedStep, error, previousResults) {
    this.log('info', 'Handling escalation', { failedStep: failedStep.name });

    // Check if there's an escalation handler defined
    if (workflow.escalationHandler) {
      const handler = this.agents.get(workflow.escalationHandler);
      if (handler) {
        try {
          const escalationResult = await handler.process({
            type: 'escalation',
            data: {
              workflow: workflow.name,
              failedStep: failedStep.name,
              error,
              previousResults
            }
          });
          
          return {
            success: false,
            escalated: true,
            escalationResult,
            previousResults
          };
        } catch (escalationError) {
          this.log('error', 'Escalation handler failed', { error: escalationError.message });
        }
      }
    }

    // Default escalation: return failure with context
    return {
      success: false,
      escalated: true,
      failedStep: failedStep.name,
      error,
      previousResults
    };
  }

  /**
   * Get orchestrator status
   */
  getStatus() {
    const agentStatuses = Array.from(this.agents.values()).map(agent => agent.getStatus());
    
    return {
      activeTasksCount: this.activeTasksCount,
      registeredAgents: this.agents.size,
      registeredWorkflows: this.workflows.size,
      agents: agentStatuses,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Utility: Sleep function
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log helper
   */
  log(level, message, metadata = {}) {
    if (this.logger) {
      this.logger[level](message, { component: 'AgentOrchestrator', ...metadata });
    }
  }
}

module.exports = AgentOrchestrator;
