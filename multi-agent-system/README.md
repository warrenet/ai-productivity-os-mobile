# Multi-Agent AI Workflow System

Advanced multi-agent system implementing sophisticated AI workflows with specialized agents, collaborative orchestration, and self-improvement capabilities.

## Overview

This system implements a comprehensive multi-agent AI workflow framework featuring:

- **7 Specialized Agents** with distinct roles and capabilities
- **Collaborative Workflow Orchestration** with escalation and retry mechanisms
- **Self-Healing & Anomaly Detection** for continuous reliability
- **Iterative Refinement** with feedback loops and learning
- **Performance & Ethics Auditing** for quality and compliance
- **User Interaction Management** for clarification and personalization

## Architecture

### Core Components

1. **BaseAgent** - Abstract base class providing common functionality
2. **AgentOrchestrator** - Manages multi-agent collaboration and workflow execution
3. **Specialized Agents** - Domain-specific agents with unique capabilities

### Specialized Agents

#### 1. ResearchAgent
**Role:** Planning and Information Gathering

**Capabilities:**
- Problem decomposition into manageable components
- Strategic planning with phases and dependencies
- Background research and knowledge gathering
- Identification of clarification needs

**Task Types:**
- `decompose` - Break down complex problems
- `plan` - Create detailed execution plans
- `research` - Gather information on topics
- `clarify` - Identify areas needing clarification

#### 2. ImplementationAgent
**Role:** Solution Development and Documentation

**Capabilities:**
- Solution architecture design
- Code implementation with reasoning
- Comprehensive documentation
- Solution optimization

**Task Types:**
- `design` - Design solution architecture
- `implement` - Implement solutions with documentation
- `document` - Create comprehensive documentation
- `optimize` - Optimize existing solutions

#### 3. VerificationAgent
**Role:** Quality Assurance and Improvement

**Capabilities:**
- Design and implementation verification
- Logic and reasoning validation
- Quality assessment and scoring
- Alternative approach suggestions

**Task Types:**
- `verify-design` - Verify solution designs
- `verify-implementation` - Verify implementations
- `verify-logic` - Check logical reasoning
- `suggest-improvements` - Suggest enhancements
- `assess-quality` - Overall quality assessment

#### 4. MetaPromptOptimizer
**Role:** Prompt Optimization and Learning

**Capabilities:**
- Prompt effectiveness analysis
- Prompt refinement and optimization
- Pattern learning from history
- Improvement suggestions

**Task Types:**
- `analyze-prompt` - Analyze prompt effectiveness
- `optimize-prompt` - Optimize prompts
- `learn-patterns` - Learn from historical data
- `suggest-improvements` - Suggest prompt improvements

#### 5. PerformanceAuditor
**Role:** Performance and Ethical Review

**Capabilities:**
- Performance metrics auditing (speed, cost, accuracy)
- Ethical compliance checking (privacy, fairness, bias)
- Regulatory compliance verification
- Improvement comparison and tracking

**Task Types:**
- `audit-performance` - Audit performance metrics
- `audit-ethics` - Audit ethical compliance
- `audit-compliance` - Check regulatory compliance
- `compare-metrics` - Compare baseline vs current metrics

#### 6. AnomalyDetectionAgent
**Role:** Anomaly Detection and Self-Correction

**Capabilities:**
- Performance anomaly detection
- Output validation and analysis
- Reasoning failure detection
- Automated recovery execution

**Task Types:**
- `detect-anomalies` - Detect anomalies in workflows
- `analyze-output` - Analyze outputs for issues
- `check-reasoning` - Validate reasoning logic
- `recover` - Execute recovery strategies

#### 7. UserInteractionAgent
**Role:** User Engagement and Feedback

**Capabilities:**
- Clarification request generation
- Feedback collection and integration
- Personalized interaction adaptation
- Option suggestion and ranking

**Task Types:**
- `request-clarification` - Request user clarifications
- `collect-feedback` - Collect user feedback
- `personalize-interaction` - Personalize communications
- `integrate-feedback` - Integrate feedback into solutions
- `suggest-options` - Suggest decision options

## Predefined Workflows

### 1. Complete Solution Workflow
Full end-to-end solution development with quality assurance.

**Steps:**
1. Research and Planning (ResearchAgent)
2. Solution Design (ImplementationAgent)
3. Design Verification (VerificationAgent)
4. Solution Implementation (ImplementationAgent)
5. Implementation Verification (VerificationAgent)
6. Performance Audit (PerformanceAuditor)
7. Anomaly Detection (AnomalyDetectionAgent)

### 2. Iterative Refinement Workflow
Continuous improvement through prompt optimization and refinement.

**Steps:**
1. Prompt Analysis (MetaPromptOptimizer)
2. Prompt Optimization (MetaPromptOptimizer)
3. Improved Research (ResearchAgent)
4. Improved Implementation (ImplementationAgent)
5. Verification (VerificationAgent)
6. Improvement Audit (PerformanceAuditor)

### 3. Quality Assurance Workflow
Comprehensive quality, ethics, and anomaly checking.

**Steps:**
1. Logic Verification (VerificationAgent)
2. Implementation Verification (VerificationAgent)
3. Quality Assessment (VerificationAgent)
4. Anomaly Detection (AnomalyDetectionAgent)
5. Performance Audit (PerformanceAuditor)
6. Ethics Audit (PerformanceAuditor)

## API Endpoints

### Status and Discovery

#### GET /status
Get system status and orchestrator information.

**Response:**
```json
{
  "service": "multi-agent-system",
  "status": "operational",
  "activeTasksCount": 0,
  "registeredAgents": 7,
  "registeredWorkflows": 3,
  "agents": [...],
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

#### GET /agents
List all available agents.

**Response:**
```json
{
  "agents": [
    {
      "name": "ResearchAgent",
      "role": "Planning and Information Gathering",
      "state": "idle"
    },
    ...
  ],
  "count": 7
}
```

#### GET /workflows
List all available workflows.

**Response:**
```json
{
  "workflows": ["complete-solution", "iterative-refinement", "quality-assurance"],
  "count": 3
}
```

#### GET /agent/:agentName/status
Get specific agent status.

**Response:**
```json
{
  "name": "ResearchAgent",
  "role": "Planning and Information Gathering",
  "state": "idle",
  "metrics": {
    "tasksProcessed": 42,
    "errors": 0,
    "averageProcessingTime": 150
  },
  "historySize": 42
}
```

### Execution

#### POST /workflow/execute
Execute a predefined workflow.

**Request:**
```json
{
  "workflowName": "complete-solution",
  "task": {
    "type": "decompose",
    "data": {
      "problem": "Build a scalable user authentication system",
      "context": {
        "platform": "web",
        "scale": "high"
      }
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "workflow": "complete-solution",
  "result": {
    "success": true,
    "workflow": "complete-solution",
    "results": [...],
    "duration": 1234,
    "timestamp": "2025-01-01T00:00:00.000Z"
  }
}
```

#### POST /agent/execute
Execute a task on a specific agent directly.

**Request:**
```json
{
  "agentName": "ResearchAgent",
  "task": {
    "type": "decompose",
    "data": {
      "problem": "Optimize database queries",
      "context": {}
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "agent": "ResearchAgent",
  "result": {
    "success": true,
    "agent": "ResearchAgent",
    "data": {
      "complexity": { "level": "medium", "score": 5 },
      "components": [...],
      "dependencies": [...],
      "reasoning": "..."
    },
    "timestamp": "2025-01-01T00:00:00.000Z"
  }
}
```

## Installation

```bash
cd multi-agent-system
npm install
```

## Configuration

Create a `.env` file:

```env
PORT=3003
NODE_ENV=development
LOG_LEVEL=info
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
```

## Running the System

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## Usage Examples

### Example 1: Research and Plan a Project

```bash
curl -X POST http://localhost:3003/agent/execute \
  -H "Content-Type: application/json" \
  -d '{
    "agentName": "ResearchAgent",
    "task": {
      "type": "plan",
      "data": {
        "components": [
          { "name": "Authentication", "description": "User auth system" },
          { "name": "Database", "description": "Data storage" }
        ],
        "context": {},
        "constraints": { "timeLimit": 45 }
      }
    }
  }'
```

### Example 2: Execute Complete Solution Workflow

```bash
curl -X POST http://localhost:3003/workflow/execute \
  -H "Content-Type: application/json" \
  -d '{
    "workflowName": "complete-solution",
    "task": {
      "type": "decompose",
      "data": {
        "problem": "Create a real-time notification system",
        "context": {
          "users": 10000,
          "requirements": ["scalability", "reliability"]
        }
      }
    }
  }'
```

### Example 3: Verify Implementation Quality

```bash
curl -X POST http://localhost:3003/agent/execute \
  -H "Content-Type: application/json" \
  -d '{
    "agentName": "VerificationAgent",
    "task": {
      "type": "verify-implementation",
      "data": {
        "implementation": {
          "code": { "files": [...] },
          "errorHandling": { "strategy": "retry" }
        },
        "design": {}
      }
    }
  }'
```

## Key Features

### 1. Retry and Escalation
Workflows support configurable retry logic and automatic escalation on failures.

### 2. Self-Healing
Anomaly detection agent identifies issues and triggers recovery strategies automatically.

### 3. Learning and Improvement
Meta-prompt optimizer learns from historical patterns to improve future interactions.

### 4. Ethics and Compliance
Performance auditor ensures solutions meet ethical standards and regulatory requirements.

### 5. User-Centric
User interaction agent personalizes communications and integrates feedback seamlessly.

### 6. Comprehensive Logging
All agent activities and decisions are logged with full context for transparency.

## Agent Collaboration Flow

```
User Input
    ↓
ResearchAgent (Decompose & Plan)
    ↓
ImplementationAgent (Design & Implement)
    ↓
VerificationAgent (Verify & Critique)
    ↓         ↘
PerformanceAuditor  MetaPromptOptimizer
    ↓                 ↓
AnomalyDetectionAgent (Detect & Recover)
    ↓
UserInteractionAgent (Clarify & Refine)
    ↓
Final Verified Output
```

## Best Practices

1. **Start with Research** - Always begin workflows with proper problem decomposition
2. **Verify Early and Often** - Run verification after each major step
3. **Monitor Performance** - Regular performance audits catch issues early
4. **Integrate Feedback** - Use user interaction agent for continuous improvement
5. **Handle Anomalies** - Configure appropriate recovery strategies
6. **Document Everything** - Use implementation agent's documentation capabilities
7. **Iterate and Refine** - Use iterative refinement workflow for optimization

## Monitoring and Debugging

### Check System Status
```bash
curl http://localhost:3003/status
```

### Check Agent Status
```bash
curl http://localhost:3003/agent/ResearchAgent/status
```

### View Logs
Logs are written to:
- `combined.log` - All logs
- `error.log` - Error logs only
- Console output (development mode)

## Extending the System

### Adding New Agents

1. Create a new agent class extending `BaseAgent`
2. Implement the `process(task)` method
3. Register the agent with the orchestrator
4. Add task type handlers

### Creating Custom Workflows

```javascript
orchestrator.registerWorkflow('custom-workflow', {
  name: 'custom-workflow',
  steps: [
    { name: 'step-1', agentName: 'ResearchAgent', config: {}, retries: 2 },
    { name: 'step-2', agentName: 'ImplementationAgent', config: {}, retries: 1 }
  ],
  escalationHandler: 'UserInteractionAgent'
});
```

## Testing

Run tests:
```bash
npm test
```

## License

Part of the AI Productivity OS Mobile project.

## Support

For issues and questions, refer to the main repository documentation.
