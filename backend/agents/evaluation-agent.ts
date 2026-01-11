/**
 * Evaluation Agent
 * Evaluates advisor performance and generates detailed reviews
 */

import { BaseAgent, ChatMessage, AgentResponse } from './base-agent.js';
import { AGENT_NAMES } from './agent-config.js';

export interface CompetencyScore {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  specificExamples: string[];
  criteria: string[];
  expectation?: string;
}

export interface PerformanceReview {
  competencyScores: Record<string, CompetencyScore>;
  overallScore: number;
  strengths: string[];
  areasForImprovement: string[];
  detailedFeedback: string;
  conversationAnalysis?: string;
}

export interface Competency {
  id: string;
  name: string;
  description: string;
  criteria: string[];
}

export interface Rubric {
  id: string;
  name: string;
  rubric: {
    beginner?: RubricLevel[];
    intermediate?: RubricLevel[];
    advanced?: RubricLevel[];
  };
}

export interface RubricLevel {
  range: string;
  description: string;
  criteria: string[];
}

export interface EvaluationRequest {
  messages: ChatMessage[];
  competencies: Competency[];
  difficulty: string;
  rubrics?: Rubric[];
}

// Default rubrics for common competencies
const defaultRubrics: Record<string, Rubric> = {
  'communication': {
    id: 'communication',
    name: 'Communication',
    rubric: {
      beginner: [
        { range: '1-2', description: 'Poor communication, unprofessional', criteria: ['Uses inappropriate language', 'Does not listen'] },
        { range: '3-4', description: 'Basic communication with issues', criteria: ['Limited active listening', 'Unclear explanations'] },
        { range: '5-6', description: 'Adequate communication', criteria: ['Reasonable clarity', 'Some listening skills'] },
        { range: '7-8', description: 'Good communication', criteria: ['Clear explanations', 'Active listening'] },
        { range: '9-10', description: 'Excellent communication', criteria: ['Exceptional clarity', 'Outstanding engagement'] },
      ],
    },
  },
  'needs-assessment': {
    id: 'needs-assessment',
    name: 'Needs Assessment',
    rubric: {
      beginner: [
        { range: '1-2', description: 'No assessment performed', criteria: ['Did not ask about goals', 'Ignored client needs'] },
        { range: '3-4', description: 'Minimal assessment', criteria: ['Few discovery questions', 'Superficial understanding'] },
        { range: '5-6', description: 'Basic assessment', criteria: ['Some discovery questions', 'Partial understanding'] },
        { range: '7-8', description: 'Thorough assessment', criteria: ['Good discovery process', 'Clear understanding'] },
        { range: '9-10', description: 'Comprehensive assessment', criteria: ['Exceptional discovery', 'Deep understanding'] },
      ],
    },
  },
  'rapport-building': {
    id: 'rapport-building',
    name: 'Rapport Building',
    rubric: {
      beginner: [
        { range: '1-2', description: 'No rapport established', criteria: ['Cold and distant', 'Made client uncomfortable'] },
        { range: '3-4', description: 'Minimal rapport', criteria: ['Limited connection', 'Some awkwardness'] },
        { range: '5-6', description: 'Basic rapport', criteria: ['Reasonable connection', 'Professional demeanor'] },
        { range: '7-8', description: 'Good rapport', criteria: ['Strong connection', 'Client felt comfortable'] },
        { range: '9-10', description: 'Excellent rapport', criteria: ['Outstanding connection', 'High trust established'] },
      ],
    },
  },
};

/**
 * Evaluation Agent Implementation
 */
export class EvaluationAgent extends BaseAgent {
  private rubricsCache: Map<string, Rubric[]> = new Map();
  private competenciesCache: Map<string, Competency[]> = new Map();

  constructor() {
    super(AGENT_NAMES.EVALUATION);
  }

  /**
   * Register tool handlers
   */
  protected registerToolHandlers(): void {
    this.toolHandlers.set('get_rubrics', this.handleGetRubrics.bind(this));
    this.toolHandlers.set('get_competencies', this.handleGetCompetencies.bind(this));
    this.toolHandlers.set('analyze_conversation', this.handleAnalyzeConversation.bind(this));
    this.toolHandlers.set('calculate_scores', this.handleCalculateScores.bind(this));
  }

  /**
   * Tool: Get rubrics
   */
  private async handleGetRubrics(args: {
    difficulty: string;
    competency_ids?: string[];
  }): Promise<Rubric[]> {
    const cacheKey = `${args.difficulty}-${(args.competency_ids || []).join(',')}`;

    if (this.rubricsCache.has(cacheKey)) {
      return this.rubricsCache.get(cacheKey)!;
    }

    // Return appropriate rubrics
    const rubrics = this.getRubricsForDifficulty(args.difficulty, args.competency_ids);
    this.rubricsCache.set(cacheKey, rubrics);
    return rubrics;
  }

  /**
   * Tool: Get competencies
   */
  private async handleGetCompetencies(args: {
    competency_ids?: string[];
  }): Promise<Competency[]> {
    const cacheKey = (args.competency_ids || []).join(',') || 'all';

    if (this.competenciesCache.has(cacheKey)) {
      return this.competenciesCache.get(cacheKey)!;
    }

    // Return competency definitions
    const competencies = this.getCompetencyDefinitions(args.competency_ids);
    this.competenciesCache.set(cacheKey, competencies);
    return competencies;
  }

  /**
   * Tool: Analyze conversation
   */
  private async handleAnalyzeConversation(args: {
    messages: ChatMessage[];
    focus_areas?: string[];
  }): Promise<any> {
    // Count message types
    const userMessages = args.messages.filter(m => m.role === 'user');
    const assistantMessages = args.messages.filter(m => m.role === 'assistant');

    return {
      messageCount: args.messages.length,
      userMessageCount: userMessages.length,
      assistantMessageCount: assistantMessages.length,
      conversationLength: args.messages.reduce((sum, m) => sum + m.content.length, 0),
      focusAreas: args.focus_areas || [],
      engagementLevel: userMessages.length > 5 ? 'high' : userMessages.length > 2 ? 'moderate' : 'low',
    };
  }

  /**
   * Tool: Calculate scores
   */
  private async handleCalculateScores(args: {
    competency_evaluations: Array<{
      name: string;
      evidence: string[];
      preliminaryScore: number;
    }>;
  }): Promise<Record<string, CompetencyScore>> {
    const scores: Record<string, CompetencyScore> = {};

    for (const evaluation of args.competency_evaluations) {
      const score = Math.max(1, Math.min(10, evaluation.preliminaryScore));

      scores[evaluation.name] = {
        score,
        feedback: this.generateFeedbackForScore(score),
        strengths: [],
        improvements: [],
        specificExamples: evaluation.evidence || [],
        criteria: [],
        expectation: this.getExpectationForScore(score),
      };
    }

    return scores;
  }

  /**
   * Generate a performance review
   */
  async generateReview(request: EvaluationRequest): Promise<AgentResponse & { review?: PerformanceReview }> {
    // Set up rubrics cache if provided
    if (request.rubrics) {
      this.rubricsCache.set('provided', request.rubrics);
    }

    // Store competencies for tool access
    const competencyList = request.competencies.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
    }));

    const context = {
      difficulty: request.difficulty,
      competencies: competencyList,
      messageCount: request.messages.length,
      userMessageCount: request.messages.filter(m => m.role === 'user').length,
    };

    // Build evaluation prompt
    const evaluationPrompt = `Evaluate this advisor conversation based on the following competencies:

${request.competencies.map(c => `- ${c.name}: ${c.description}`).join('\n')}

Difficulty Level: ${request.difficulty}

IMPORTANT INSTRUCTIONS:
- Be HONEST and CRITICAL - do not inflate scores
- Use the FULL scoring range (1-10)
- Base evaluations on specific evidence from the conversation
- If the advisor sent very few messages, they should receive low scores
- Do NOT give credit for skills not demonstrated

Use the tools to get rubrics, analyze the conversation, and calculate scores.

Return the evaluation as a JSON object:
{
  "overallScore": number (1-10),
  "competencyScores": {
    "competencyName": {
      "score": number,
      "feedback": "string",
      "strengths": ["string"],
      "improvements": ["string"],
      "specificExamples": ["string"],
      "criteria": ["string"]
    }
  },
  "strengths": ["string"],
  "areasForImprovement": ["string"],
  "detailedFeedback": "string",
  "conversationAnalysis": "string"
}`;

    const messages: ChatMessage[] = [
      { role: 'system', content: evaluationPrompt },
      ...request.messages.filter(m => m.role !== 'system'),
    ];

    const response = await this.chat(messages, context);

    // Parse the review from the response
    let review: PerformanceReview | undefined;
    try {
      const jsonMatch = response.message.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        review = {
          competencyScores: parsed.competencyScores || {},
          overallScore: parsed.overallScore || 5,
          strengths: parsed.strengths || [],
          areasForImprovement: parsed.areasForImprovement || [],
          detailedFeedback: parsed.detailedFeedback || parsed.summary || '',
          conversationAnalysis: parsed.conversationAnalysis,
        };

        // Add expectations to scores
        for (const [name, score] of Object.entries(review.competencyScores)) {
          (score as CompetencyScore).expectation = this.getExpectationForScore((score as CompetencyScore).score);
        }
      }
    } catch (error) {
      console.error('[EvaluationAgent] Failed to parse review:', error);
    }

    return {
      ...response,
      review,
    };
  }

  /**
   * Get rubrics for a difficulty level
   */
  private getRubricsForDifficulty(difficulty: string, competencyIds?: string[]): Rubric[] {
    const rubrics: Rubric[] = [];
    const diffKey = difficulty.toLowerCase() as keyof Rubric['rubric'];

    // Get matching rubrics
    for (const [id, rubric] of Object.entries(defaultRubrics)) {
      if (!competencyIds || competencyIds.includes(id)) {
        rubrics.push(rubric);
      }
    }

    return rubrics;
  }

  /**
   * Get competency definitions
   */
  private getCompetencyDefinitions(ids?: string[]): Competency[] {
    const allCompetencies: Competency[] = [
      {
        id: 'communication',
        name: 'Communication',
        description: 'Clarity, professionalism, and effectiveness of communication',
        criteria: ['Clear explanations', 'Active listening', 'Professional language'],
      },
      {
        id: 'needs-assessment',
        name: 'Needs Assessment',
        description: 'Ability to discover and understand client needs',
        criteria: ['Discovery questions', 'Understanding goals', 'Identifying concerns'],
      },
      {
        id: 'rapport-building',
        name: 'Rapport Building',
        description: 'Establishing trust and connection with the client',
        criteria: ['Building trust', 'Personal connection', 'Client comfort'],
      },
      {
        id: 'objection-handling',
        name: 'Objection Handling',
        description: 'Addressing client concerns and objections professionally',
        criteria: ['Acknowledging concerns', 'Providing solutions', 'Maintaining composure'],
      },
      {
        id: 'solution-recommendation',
        name: 'Solution Recommendation',
        description: 'Providing appropriate recommendations based on client needs',
        criteria: ['Relevant solutions', 'Clear explanations', 'Value demonstration'],
      },
    ];

    if (ids && ids.length > 0) {
      return allCompetencies.filter(c => ids.includes(c.id));
    }

    return allCompetencies;
  }

  /**
   * Generate feedback text for a score
   */
  private generateFeedbackForScore(score: number): string {
    if (score >= 9) return 'Outstanding performance that exceeds expectations.';
    if (score >= 7) return 'Strong performance that meets expectations.';
    if (score >= 5) return 'Satisfactory performance with room for improvement.';
    if (score >= 3) return 'Below expectations. Significant improvement needed.';
    return 'Critical improvement required. Performance is unacceptable.';
  }

  /**
   * Get expectation text for a score
   */
  private getExpectationForScore(score: number): string {
    if (score >= 9) return 'Outstanding performance that exceeds expectations.';
    if (score >= 7) return 'Strong performance that meets expectations.';
    if (score >= 5) return 'Satisfactory performance with room for improvement.';
    if (score >= 3) return 'Below expectations. Significant improvement needed.';
    return 'Critical improvement required. Performance is unacceptable.';
  }
}

// Export singleton instance
export const evaluationAgent = new EvaluationAgent();

export default evaluationAgent;
