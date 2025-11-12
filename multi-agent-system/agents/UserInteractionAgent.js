const BaseAgent = require('../lib/BaseAgent');

/**
 * UserInteractionAgent - Interactive User Engagement and Feedback Loop
 * Continuously prompts for further user clarifications when ambiguity arises
 * Personalizes questions and suggestions to the user's context and goals
 * Integrates feedback for final refinement
 */
class UserInteractionAgent extends BaseAgent {
  constructor(logger) {
    super('UserInteractionAgent', 'User Engagement and Feedback', logger);
    this.userContext = new Map();
    this.feedbackHistory = [];
    this.clarificationTemplates = this.initializeTemplates();
  }

  initializeTemplates() {
    return {
      requirement: 'Could you provide more details about {topic}?',
      constraint: 'Are there any constraints regarding {aspect} that we should consider?',
      priority: 'What is the priority level for {item}?',
      preference: 'Do you prefer {option1} or {option2} for {feature}?',
      validation: 'Does this approach meet your expectations: {approach}?',
      confirmation: 'Can you confirm that {statement} is correct?'
    };
  }

  async process(task) {
    this.validateTask(task);
    this.setState('interacting');
    
    const startTime = Date.now();
    
    try {
      let result;
      
      switch (task.type) {
        case 'request-clarification':
          result = await this.requestClarification(task.data);
          break;
        case 'collect-feedback':
          result = await this.collectFeedback(task.data);
          break;
        case 'personalize-interaction':
          result = await this.personalizeInteraction(task.data);
          break;
        case 'integrate-feedback':
          result = await this.integrateFeedback(task.data);
          break;
        case 'suggest-options':
          result = await this.suggestOptions(task.data);
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

  async requestClarification(data) {
    const { ambiguities, context = {}, userId } = data;
    
    if (!ambiguities || ambiguities.length === 0) {
      throw new Error('No ambiguities provided for clarification');
    }

    this.log('info', 'Requesting clarifications from user', { count: ambiguities.length });

    // Get user context for personalization
    const userCtx = this.userContext.get(userId) || { preferences: {}, history: [] };

    // Generate personalized questions
    const questions = ambiguities.map((amb, index) => {
      const template = this.selectTemplate(amb.type);
      const personalizedQuestion = this.personalizeQuestion(template, amb, userCtx);
      
      return {
        id: `clarification-${Date.now()}-${index}`,
        type: amb.type,
        question: personalizedQuestion,
        priority: amb.priority || 'medium',
        context: amb.context || {},
        suggestedAnswers: this.generateSuggestedAnswers(amb, userCtx)
      };
    });

    // Update user context
    userCtx.history.push({
      timestamp: Date.now(),
      type: 'clarification-request',
      questions: questions.map(q => q.id)
    });
    this.userContext.set(userId, userCtx);

    return {
      questions,
      reasoning: 'Personalized clarification questions generated based on user context and ambiguities'
    };
  }

  async collectFeedback(data) {
    const { targetItem, feedbackType, context = {}, userId } = data;
    
    this.log('info', 'Collecting user feedback', { type: feedbackType });

    const feedbackRequest = {
      id: `feedback-${Date.now()}`,
      targetItem,
      type: feedbackType,
      questions: this.generateFeedbackQuestions(targetItem, feedbackType, context),
      format: this.determineFeedbackFormat(feedbackType),
      timestamp: Date.now()
    };

    // Store in feedback history
    this.feedbackHistory.push(feedbackRequest);
    
    // Keep only last 100 entries
    if (this.feedbackHistory.length > 100) {
      this.feedbackHistory.shift();
    }

    return {
      feedbackRequest,
      reasoning: 'Feedback collection structured based on target item and user context'
    };
  }

  async personalizeInteraction(data) {
    const { userId, interactionType, content } = data;
    
    this.log('info', 'Personalizing interaction', { userId, type: interactionType });

    // Get or create user context
    let userCtx = this.userContext.get(userId);
    if (!userCtx) {
      userCtx = {
        preferences: {},
        history: [],
        goals: [],
        expertise: 'intermediate'
      };
      this.userContext.set(userId, userCtx);
    }

    // Analyze user's expertise and preferences
    const analysis = this.analyzeUserContext(userCtx);
    
    // Personalize content
    const personalized = {
      original: content,
      adapted: this.adaptContent(content, analysis),
      tone: this.selectTone(analysis),
      detailLevel: this.selectDetailLevel(analysis),
      suggestions: this.generatePersonalizedSuggestions(content, analysis)
    };

    return {
      personalized,
      reasoning: 'Interaction personalized based on user expertise, preferences, and history'
    };
  }

  async integrateFeedback(data) {
    const { feedback, target, context = {} } = data;
    
    if (!feedback || !target) {
      throw new Error('Feedback and target are required for integration');
    }

    this.log('info', 'Integrating user feedback');

    const integration = {
      originalTarget: target,
      feedbackApplied: [],
      refinedTarget: this.applyFeedback(target, feedback),
      changes: this.documentChanges(target, feedback),
      validation: this.validateFeedbackIntegration(target, feedback)
    };

    // Track what feedback was applied
    feedback.forEach(fb => {
      if (fb.applied !== false) {
        integration.feedbackApplied.push({
          type: fb.type,
          content: fb.content,
          impact: fb.impact || 'medium'
        });
      }
    });

    return {
      integration,
      reasoning: 'Feedback integrated with documented changes and validation'
    };
  }

  async suggestOptions(data) {
    const { decision, context = {}, userId } = data;
    
    if (!decision) {
      throw new Error('Decision context is required for suggestions');
    }

    this.log('info', 'Suggesting options to user');

    const userCtx = this.userContext.get(userId) || {};
    const options = this.generateOptions(decision, context, userCtx);
    
    // Rank options based on user context
    const rankedOptions = this.rankOptions(options, userCtx);

    const suggestion = {
      decision,
      options: rankedOptions,
      recommendation: rankedOptions[0],
      reasoning: this.explainRecommendation(rankedOptions[0], userCtx),
      tradeoffs: this.explainTradeoffs(rankedOptions)
    };

    return {
      suggestion,
      reasoning: 'Options generated and ranked based on user context and preferences'
    };
  }

  // Helper methods
  selectTemplate(ambiguityType) {
    return this.clarificationTemplates[ambiguityType] || 
           this.clarificationTemplates.requirement;
  }

  personalizeQuestion(template, ambiguity, userContext) {
    let question = template;
    
    // Replace placeholders
    Object.keys(ambiguity).forEach(key => {
      const placeholder = `{${key}}`;
      if (question.includes(placeholder)) {
        question = question.replace(placeholder, ambiguity[key]);
      }
    });

    // Adjust tone based on user expertise
    if (userContext.expertise === 'beginner') {
      question = this.simplifyLanguage(question);
    } else if (userContext.expertise === 'expert') {
      question = this.addTechnicalDetail(question);
    }

    return question;
  }

  generateSuggestedAnswers(ambiguity, userContext) {
    const suggestions = [];
    
    switch (ambiguity.type) {
      case 'priority':
        suggestions.push('high', 'medium', 'low');
        break;
      case 'preference':
        suggestions.push('option A', 'option B', 'both', 'neither');
        break;
      case 'confirmation':
        suggestions.push('yes', 'no', 'partially');
        break;
      default:
        // No predefined suggestions
        break;
    }

    return suggestions;
  }

  generateFeedbackQuestions(targetItem, feedbackType, context) {
    const questions = [];

    switch (feedbackType) {
      case 'design':
        questions.push(
          'Does this design meet your requirements?',
          'Are there any aspects you would like to change?',
          'Is the approach clear and understandable?'
        );
        break;
      case 'implementation':
        questions.push(
          'Does this implementation solve your problem?',
          'Are there any issues or concerns?',
          'Would you like any additional features?'
        );
        break;
      case 'performance':
        questions.push(
          'Is the performance acceptable?',
          'Are there any bottlenecks you\'ve noticed?',
          'What are your performance targets?'
        );
        break;
      default:
        questions.push(
          'How well does this meet your expectations?',
          'What improvements would you suggest?'
        );
    }

    return questions;
  }

  determineFeedbackFormat(feedbackType) {
    const formats = {
      design: 'structured',
      implementation: 'freeform',
      performance: 'metrics',
      general: 'rating'
    };

    return formats[feedbackType] || 'freeform';
  }

  analyzeUserContext(userContext) {
    return {
      expertise: userContext.expertise || 'intermediate',
      prefersTechnical: userContext.preferences?.technical || false,
      prefersVisuals: userContext.preferences?.visuals || false,
      averageResponseTime: this.calculateAverageResponseTime(userContext.history),
      commonTopics: this.identifyCommonTopics(userContext.history)
    };
  }

  adaptContent(content, analysis) {
    let adapted = content;

    // Adjust for expertise level
    if (analysis.expertise === 'beginner') {
      adapted = this.simplifyLanguage(adapted);
    }

    // Add technical details for expert users
    if (analysis.expertise === 'expert' && analysis.prefersTechnical) {
      adapted += '\n\nTechnical details: [Additional context would be provided here]';
    }

    return adapted;
  }

  selectTone(analysis) {
    if (analysis.expertise === 'beginner') {
      return 'friendly and explanatory';
    } else if (analysis.expertise === 'expert') {
      return 'technical and concise';
    }
    return 'professional and balanced';
  }

  selectDetailLevel(analysis) {
    if (analysis.expertise === 'beginner') {
      return 'high';
    } else if (analysis.expertise === 'expert') {
      return 'medium';
    }
    return 'medium';
  }

  generatePersonalizedSuggestions(content, analysis) {
    const suggestions = [];

    if (analysis.prefersVisuals) {
      suggestions.push('Consider adding diagrams or visualizations');
    }

    if (analysis.commonTopics?.length > 0) {
      suggestions.push(`Related to your previous work on: ${analysis.commonTopics[0]}`);
    }

    return suggestions;
  }

  applyFeedback(target, feedback) {
    // Create a deep copy of target
    const refined = JSON.parse(JSON.stringify(target));

    // Apply each piece of feedback
    feedback.forEach(fb => {
      if (fb.field && fb.newValue !== undefined) {
        refined[fb.field] = fb.newValue;
      } else if (fb.changes) {
        Object.assign(refined, fb.changes);
      }
    });

    return refined;
  }

  documentChanges(target, feedback) {
    return feedback.map(fb => ({
      field: fb.field || 'multiple',
      oldValue: fb.field ? target[fb.field] : 'various',
      newValue: fb.newValue || fb.changes,
      reason: fb.reason || 'User feedback'
    }));
  }

  validateFeedbackIntegration(target, feedback) {
    return {
      allApplied: feedback.every(fb => fb.applied !== false),
      conflicts: [],
      warnings: []
    };
  }

  generateOptions(decision, context, userContext) {
    // Generate 3-5 options based on decision type
    const options = [
      {
        id: 'option-1',
        name: 'Standard Approach',
        description: 'Use established patterns and best practices',
        pros: ['Reliable', 'Well-documented', 'Community support'],
        cons: ['May be slower', 'Less flexible']
      },
      {
        id: 'option-2',
        name: 'Optimized Approach',
        description: 'Focus on performance and efficiency',
        pros: ['Fast', 'Efficient', 'Scalable'],
        cons: ['More complex', 'Requires expertise']
      },
      {
        id: 'option-3',
        name: 'Balanced Approach',
        description: 'Compromise between reliability and performance',
        pros: ['Good balance', 'Maintainable', 'Flexible'],
        cons: ['May not excel in any area']
      }
    ];

    return options;
  }

  rankOptions(options, userContext) {
    // Simple ranking based on user preferences
    return options.sort((a, b) => {
      // Prefer simpler options for beginners
      if (userContext.expertise === 'beginner') {
        if (a.id === 'option-1') return -1;
        if (b.id === 'option-1') return 1;
      }
      
      // Prefer optimized options for experts
      if (userContext.expertise === 'expert') {
        if (a.id === 'option-2') return -1;
        if (b.id === 'option-2') return 1;
      }

      return 0;
    });
  }

  explainRecommendation(option, userContext) {
    return `Based on your expertise level (${userContext.expertise || 'intermediate'}), ${option.name} is recommended because ${option.pros[0].toLowerCase()}.`;
  }

  explainTradeoffs(options) {
    return options.map(opt => ({
      option: opt.name,
      mainBenefit: opt.pros[0],
      mainDrawback: opt.cons[0]
    }));
  }

  simplifyLanguage(text) {
    return text
      .replace(/utilize/g, 'use')
      .replace(/implement/g, 'build')
      .replace(/optimize/g, 'improve');
  }

  addTechnicalDetail(text) {
    return text + ' (considering performance implications and scalability)';
  }

  calculateAverageResponseTime(history) {
    if (!history || history.length < 2) return 0;
    
    let totalTime = 0;
    let count = 0;
    
    for (let i = 1; i < history.length; i++) {
      const timeDiff = history[i].timestamp - history[i-1].timestamp;
      if (timeDiff > 0 && timeDiff < 3600000) { // Less than 1 hour
        totalTime += timeDiff;
        count++;
      }
    }
    
    return count > 0 ? totalTime / count : 0;
  }

  identifyCommonTopics(history) {
    const topics = new Map();
    
    history.forEach(item => {
      if (item.type) {
        topics.set(item.type, (topics.get(item.type) || 0) + 1);
      }
    });

    // Sort by frequency and return top 3
    return Array.from(topics.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([topic]) => topic);
  }
}

module.exports = UserInteractionAgent;
