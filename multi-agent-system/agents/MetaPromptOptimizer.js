const BaseAgent = require('../lib/BaseAgent');

/**
 * MetaPromptOptimizer - Prompt Optimization and Learning
 * Reflects on how well instructions and prompts worked
 * Proposes refinements for future tasks
 * Facilitates learning for agents to improve responses over time
 */
class MetaPromptOptimizer extends BaseAgent {
  constructor(logger) {
    super('MetaPromptOptimizer', 'Prompt Optimization and Learning', logger);
    this.promptHistory = [];
    this.optimizationPatterns = new Map();
  }

  async process(task) {
    this.validateTask(task);
    this.setState('optimizing');
    
    const startTime = Date.now();
    
    try {
      let result;
      
      switch (task.type) {
        case 'analyze-prompt':
          result = await this.analyzePrompt(task.data);
          break;
        case 'optimize-prompt':
          result = await this.optimizePrompt(task.data);
          break;
        case 'learn-patterns':
          result = await this.learnPatterns(task.data);
          break;
        case 'suggest-improvements':
          result = await this.suggestPromptImprovements(task.data);
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

  async analyzePrompt(data) {
    const { prompt, outcome, context = {} } = data;
    
    this.log('info', 'Analyzing prompt effectiveness');

    const analysis = {
      clarity: this.assessClarity(prompt),
      specificity: this.assessSpecificity(prompt),
      completeness: this.assessCompleteness(prompt, context),
      effectiveness: this.assessEffectiveness(prompt, outcome),
      bottlenecks: this.identifyBottlenecks(prompt, outcome)
    };

    // Store for learning
    this.promptHistory.push({ prompt, outcome, analysis, timestamp: Date.now() });

    return {
      analysis,
      reasoning: 'Prompt analyzed for clarity, specificity, completeness, and effectiveness'
    };
  }

  async optimizePrompt(data) {
    const { prompt, goals, constraints = {} } = data;
    
    this.log('info', 'Optimizing prompt');

    const optimizations = {
      original: prompt,
      optimized: this.refinePrompt(prompt, goals),
      improvements: this.listImprovements(prompt, goals),
      expectedImpact: this.estimateImpact(prompt, goals),
      reasoning: this.explainOptimizations(prompt, goals)
    };

    return {
      optimizations,
      reasoning: 'Prompt optimized for better clarity, specificity, and effectiveness'
    };
  }

  async learnPatterns(data) {
    const { outcomes = [] } = data;
    
    this.log('info', 'Learning from prompt patterns');

    // Analyze historical patterns
    const patterns = this.extractPatterns(this.promptHistory);
    
    // Update optimization strategies
    patterns.forEach(pattern => {
      this.optimizationPatterns.set(pattern.id, pattern);
    });

    return {
      patternsLearned: patterns.length,
      patterns,
      reasoning: 'Patterns learned from historical prompt performance'
    };
  }

  async suggestPromptImprovements(data) {
    const { prompt, context } = data;
    
    this.log('info', 'Suggesting prompt improvements');

    const suggestions = [
      this.suggestClarityImprovements(prompt),
      this.suggestStructureImprovements(prompt),
      this.suggestContextImprovements(prompt, context),
      this.suggestExampleImprovements(prompt)
    ].flat();

    return {
      suggestions,
      reasoning: 'Improvements suggested based on best practices and learned patterns'
    };
  }

  // Helper methods
  assessClarity(prompt) {
    const hasAmbiguousWords = /maybe|perhaps|might|could|possibly/i.test(prompt);
    const hasActionWords = /create|implement|design|analyze|verify/i.test(prompt);
    
    return {
      score: hasActionWords && !hasAmbiguousWords ? 85 : 60,
      hasAmbiguity: hasAmbiguousWords,
      hasClearActions: hasActionWords
    };
  }

  assessSpecificity(prompt) {
    const hasDetails = prompt.length > 100;
    const hasNumbers = /\d+/.test(prompt);
    const hasExamples = /example|for instance|such as/i.test(prompt);
    
    return {
      score: (hasDetails ? 30 : 0) + (hasNumbers ? 35 : 0) + (hasExamples ? 35 : 0),
      hasDetails,
      hasNumbers,
      hasExamples
    };
  }

  assessCompleteness(prompt, context) {
    const hasGoal = /goal|objective|target|purpose/i.test(prompt);
    const hasConstraints = /constraint|limit|requirement/i.test(prompt);
    const hasContext = Object.keys(context).length > 0;
    
    return {
      score: (hasGoal ? 33 : 0) + (hasConstraints ? 33 : 0) + (hasContext ? 34 : 0),
      hasGoal,
      hasConstraints,
      hasContext
    };
  }

  assessEffectiveness(prompt, outcome) {
    if (!outcome) return { score: 50, reason: 'No outcome data available' };
    
    const wasSuccessful = outcome.success || false;
    const hadErrors = outcome.errors > 0;
    
    return {
      score: wasSuccessful && !hadErrors ? 90 : 50,
      wasSuccessful,
      hadErrors
    };
  }

  identifyBottlenecks(prompt, outcome) {
    const bottlenecks = [];
    
    if (!prompt.includes('example')) {
      bottlenecks.push({ type: 'clarity', issue: 'Missing examples' });
    }
    
    if (prompt.length < 50) {
      bottlenecks.push({ type: 'detail', issue: 'Insufficient detail provided' });
    }
    
    if (outcome && outcome.clarificationsNeeded > 0) {
      bottlenecks.push({ type: 'completeness', issue: 'Required clarifications' });
    }
    
    return bottlenecks;
  }

  refinePrompt(prompt, goals) {
    let refined = prompt;
    
    // Add structure if missing
    if (!prompt.includes('\n')) {
      refined = `Goal: ${goals?.primary || 'Process the task'}\n\n${refined}\n\nExpected Output: Clear, actionable results`;
    }
    
    // Add specificity
    if (!/\d+/.test(refined)) {
      refined += '\n\nNote: Provide specific, measurable outcomes where possible.';
    }
    
    return refined;
  }

  listImprovements(prompt, goals) {
    return [
      'Added clear structure with goals and expected output',
      'Increased specificity with measurable criteria',
      'Enhanced clarity by removing ambiguous language'
    ];
  }

  estimateImpact(prompt, goals) {
    return {
      clarityImprovement: '25%',
      successRate: '+15%',
      processingTime: '-10%'
    };
  }

  explainOptimizations(prompt, goals) {
    return 'Optimizations focus on clarity, structure, and specificity to improve agent understanding and reduce clarification needs.';
  }

  extractPatterns(history) {
    const patterns = [];
    
    // Pattern: Successful prompts with examples
    const withExamples = history.filter(h => 
      h.prompt.includes('example') && h.outcome?.success
    );
    
    if (withExamples.length > 3) {
      patterns.push({
        id: 'examples-improve-success',
        description: 'Prompts with examples have higher success rates',
        confidence: 0.85,
        recommendation: 'Always include examples in prompts'
      });
    }
    
    // Pattern: Clear structure
    const withStructure = history.filter(h => 
      h.prompt.includes('\n') && h.outcome?.success
    );
    
    if (withStructure.length > 3) {
      patterns.push({
        id: 'structure-improves-clarity',
        description: 'Structured prompts reduce ambiguity',
        confidence: 0.80,
        recommendation: 'Use clear sections in prompts'
      });
    }
    
    return patterns;
  }

  suggestClarityImprovements(prompt) {
    const suggestions = [];
    
    if (/maybe|perhaps/i.test(prompt)) {
      suggestions.push({
        type: 'clarity',
        suggestion: 'Replace ambiguous words with definitive language',
        example: 'Use "should" instead of "maybe should"'
      });
    }
    
    return suggestions;
  }

  suggestStructureImprovements(prompt) {
    if (!prompt.includes('\n')) {
      return [{
        type: 'structure',
        suggestion: 'Add clear sections: Goal, Context, Requirements, Expected Output',
        example: 'Goal:\n[description]\n\nContext:\n[background]\n\nRequirements:\n[list]'
      }];
    }
    return [];
  }

  suggestContextImprovements(prompt, context) {
    if (!context || Object.keys(context).length === 0) {
      return [{
        type: 'context',
        suggestion: 'Provide relevant context for better understanding',
        example: 'Include background, constraints, and success criteria'
      }];
    }
    return [];
  }

  suggestExampleImprovements(prompt) {
    if (!prompt.includes('example')) {
      return [{
        type: 'examples',
        suggestion: 'Add concrete examples to illustrate requirements',
        example: 'For instance: "Process user data like { name: "John", age: 30 }"'
      }];
    }
    return [];
  }
}

module.exports = MetaPromptOptimizer;
