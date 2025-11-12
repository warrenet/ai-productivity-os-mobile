const BaseAgent = require('../lib/BaseAgent');

/**
 * ResearchAgent - Planning and Information Gathering
 * Decomposes complex problems, plans solutions, gathers background knowledge
 * Asks for clarifications when aspects are vague
 */
class ResearchAgent extends BaseAgent {
  constructor(logger) {
    super('ResearchAgent', 'Planning and Information Gathering', logger);
    this.knowledgeBase = new Map();
  }

  /**
   * Process research tasks: decompose, plan, gather information
   */
  async process(task) {
    this.validateTask(task);
    this.setState('processing');
    
    const startTime = Date.now();
    
    try {
      let result;
      
      switch (task.type) {
        case 'decompose':
          result = await this.decomposeProblem(task.data);
          break;
        case 'plan':
          result = await this.createPlan(task.data);
          break;
        case 'research':
          result = await this.gatherInformation(task.data);
          break;
        case 'clarify':
          result = await this.identifyClarifications(task.data);
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

  /**
   * Decompose a complex problem into manageable pieces
   */
  async decomposeProblem(data) {
    const { problem, context = {} } = data;
    
    if (!problem || typeof problem !== 'string') {
      throw new Error('Invalid problem description');
    }

    this.log('info', 'Decomposing problem', { problem: problem.substring(0, 100) });

    // Analyze problem complexity
    const complexity = this.assessComplexity(problem);
    
    // Break down into components
    const components = this.identifyComponents(problem, context);
    
    // Identify dependencies
    const dependencies = this.identifyDependencies(components);
    
    return {
      complexity,
      components,
      dependencies,
      reasoning: 'Problem decomposed into manageable components with clear dependencies'
    };
  }

  /**
   * Create a detailed plan for solving the problem
   */
  async createPlan(data) {
    const { components, context = {}, constraints = {} } = data;
    
    if (!Array.isArray(components)) {
      throw new Error('Components must be an array');
    }

    this.log('info', 'Creating plan', { componentCount: components.length });

    const plan = {
      phases: [],
      estimatedDuration: 0,
      requiredResources: [],
      risks: []
    };

    // Create phases based on components
    components.forEach((component, index) => {
      const phase = {
        id: `phase-${index + 1}`,
        name: component.name || `Phase ${index + 1}`,
        description: component.description || '',
        tasks: this.generateTasks(component),
        dependencies: component.dependencies || [],
        estimatedTime: this.estimateTime(component)
      };
      
      plan.phases.push(phase);
      plan.estimatedDuration += phase.estimatedTime;
    });

    // Identify required resources
    plan.requiredResources = this.identifyResources(components, context);
    
    // Assess risks
    plan.risks = this.assessRisks(components, constraints);

    return {
      plan,
      reasoning: 'Comprehensive plan created with phases, tasks, and risk assessment'
    };
  }

  /**
   * Gather background information and research
   */
  async gatherInformation(data) {
    const { topic, scope = 'general' } = data;
    
    if (!topic) {
      throw new Error('Topic is required for research');
    }

    this.log('info', 'Gathering information', { topic, scope });

    // Check knowledge base first
    const cachedInfo = this.knowledgeBase.get(topic);
    if (cachedInfo && Date.now() - cachedInfo.timestamp < 3600000) {
      this.log('info', 'Using cached knowledge', { topic });
      return cachedInfo.data;
    }

    // Simulate gathering information
    const information = {
      topic,
      scope,
      keyPoints: this.extractKeyPoints(topic),
      resources: this.identifyResourcesNeeded(topic),
      technicalRequirements: this.identifyTechnicalRequirements(topic),
      bestPractices: this.identifyBestPractices(topic)
    };

    // Cache the information
    this.knowledgeBase.set(topic, {
      data: information,
      timestamp: Date.now()
    });

    return {
      information,
      reasoning: 'Information gathered from knowledge base and analysis'
    };
  }

  /**
   * Identify areas needing clarification
   */
  async identifyClarifications(data) {
    const { problem, plan } = data;
    
    this.log('info', 'Identifying clarifications needed');

    const clarifications = [];

    // Check for vague requirements
    if (this.hasVagueRequirements(problem)) {
      clarifications.push({
        type: 'requirement',
        question: 'Could you provide more specific requirements for the expected outcome?',
        priority: 'high'
      });
    }

    // Check for missing constraints
    if (this.hasMissingConstraints(plan)) {
      clarifications.push({
        type: 'constraint',
        question: 'Are there any constraints (time, budget, technical) we should be aware of?',
        priority: 'medium'
      });
    }

    // Check for unclear scope
    if (this.hasUnclearScope(problem)) {
      clarifications.push({
        type: 'scope',
        question: 'Could you clarify the scope and boundaries of this problem?',
        priority: 'high'
      });
    }

    return {
      clarifications,
      reasoning: 'Identified areas requiring user clarification for successful execution'
    };
  }

  // Helper methods
  assessComplexity(problem) {
    const length = problem.length;
    const keywords = ['complex', 'multiple', 'various', 'integrate', 'coordinate'];
    const hasComplexKeywords = keywords.some(kw => problem.toLowerCase().includes(kw));
    
    if (length > 500 || hasComplexKeywords) {
      return { level: 'high', score: 8 };
    } else if (length > 200) {
      return { level: 'medium', score: 5 };
    }
    return { level: 'low', score: 3 };
  }

  identifyComponents(problem, context) {
    // Simplified component identification
    const components = [];
    const sentences = problem.split(/[.!?]+/).filter(s => s.trim());
    
    sentences.forEach((sentence, index) => {
      if (sentence.trim().length > 10) {
        components.push({
          id: `component-${index + 1}`,
          name: sentence.trim().substring(0, 50),
          description: sentence.trim(),
          priority: index === 0 ? 'high' : 'medium'
        });
      }
    });
    
    return components;
  }

  identifyDependencies(components) {
    return components.map((comp, index) => ({
      component: comp.id,
      dependsOn: index > 0 ? [components[index - 1].id] : []
    }));
  }

  generateTasks(component) {
    return [
      { id: 1, name: `Analyze ${component.name}`, status: 'pending' },
      { id: 2, name: `Implement ${component.name}`, status: 'pending' },
      { id: 3, name: `Verify ${component.name}`, status: 'pending' }
    ];
  }

  estimateTime(component) {
    return Math.ceil(Math.random() * 5 + 2); // 2-7 time units
  }

  identifyResources(components, context) {
    const resources = ['Development environment', 'Testing framework', 'Documentation tools'];
    if (components.length > 5) {
      resources.push('Additional team members', 'Project management tools');
    }
    return resources;
  }

  assessRisks(components, constraints) {
    const risks = [];
    
    if (components.length > 10) {
      risks.push({
        type: 'complexity',
        description: 'High number of components may increase integration challenges',
        severity: 'medium'
      });
    }
    
    if (constraints.timeLimit && constraints.timeLimit < 30) {
      risks.push({
        type: 'timeline',
        description: 'Tight timeline may impact quality',
        severity: 'high'
      });
    }
    
    return risks;
  }

  extractKeyPoints(topic) {
    return [`Key aspect of ${topic}`, `Important consideration for ${topic}`, `Best approach to ${topic}`];
  }

  identifyResourcesNeeded(topic) {
    return ['Technical documentation', 'Development tools', 'Testing infrastructure'];
  }

  identifyTechnicalRequirements(topic) {
    return ['Programming language/framework', 'Database/storage', 'API integrations'];
  }

  identifyBestPractices(topic) {
    return ['Follow industry standards', 'Implement proper error handling', 'Include comprehensive testing'];
  }

  hasVagueRequirements(problem) {
    const vagueWords = ['something', 'maybe', 'kind of', 'sort of', 'somehow'];
    return vagueWords.some(word => problem.toLowerCase().includes(word));
  }

  hasMissingConstraints(plan) {
    return !plan || !plan.constraints || Object.keys(plan.constraints).length === 0;
  }

  hasUnclearScope(problem) {
    return problem.length < 50 || !problem.includes('should') && !problem.includes('must');
  }
}

module.exports = ResearchAgent;
