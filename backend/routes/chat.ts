import express from 'express';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { isAzureConfigured } from '../config/index.ts';
import {
  areAgentsAvailable,
  simulationClientAgent,
  expertGuidanceAgent,
  type SimulationContext,
} from '../agents/index.ts';

const router = express.Router();

// In-memory API key storage (in production, use secure storage)
let storedApiKey = process.env.OPENAI_API_KEY || '';

// POST /api/chat/client-response - Generate AI client response
router.post('/client-response', async (req: express.Request, res: express.Response) => {
  try {
    const { messages, clientProfile, personalitySettings, simulationSettings, apiKey } = req.body;

    // Try Azure agents first if available
    if (areAgentsAvailable()) {
      try {
        console.log(`[CHAT] Using Azure agent for simulation ${simulationSettings.simulationId}`);

        const context: SimulationContext = {
          sessionId: simulationSettings.simulationId || `session-${Date.now()}`,
          clientProfile,
          personalitySettings: personalitySettings || {
            mood: 'neutral',
            archetype: 'Standard Client',
            traits: { openness: 50, agreeableness: 50, conscientiousness: 50, neuroticism: 50, extraversion: 50 },
            influence: 'balanced',
          },
          simulationSettings,
        };

        const result = await simulationClientAgent.generateResponse(messages, context);

        if (result.success) {
          console.log(`[CHAT] Azure agent succeeded for simulation ${simulationSettings.simulationId}`);

          // If Azure agent didn't return objectiveProgress, evaluate separately
          let objectiveProgress = result.objectiveProgress;
          if (!objectiveProgress && messages.length > 2) {
            try {
              console.log('[CHAT] Evaluating objectives for Azure response...');
              objectiveProgress = await evaluateObjectivesWithOpenAI(messages, apiKey || storedApiKey || process.env.OPENAI_API_KEY);
            } catch (error) {
              console.warn('[CHAT] Failed to evaluate objectives:', error);
            }
          }

          return res.json({
            success: true,
            message: result.message,
            objectiveProgress,
            source: 'azure',
          });
        }

        console.warn('[CHAT] Azure agent failed, falling back to OpenAI');
      } catch (error) {
        console.error('[CHAT] Azure agent error:', error);
        console.warn('[CHAT] Falling back to OpenAI');
      }
    }

    // Fallback to OpenAI
    const effectiveApiKey = apiKey || storedApiKey || process.env.OPENAI_API_KEY;

    if (!effectiveApiKey) {
      return res.status(400).json({
        success: false,
        message: 'OpenAI API key is missing. Please configure it in the API Settings page.',
        objectiveProgress: null
      });
    }

    // Build system prompt
    const systemPrompt = buildSystemPrompt(clientProfile, personalitySettings, simulationSettings);

    // Format messages for API
    const formattedMessages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...messages.filter((m: any) => m.role !== 'system'),
    ];

    console.log(`[CHAT] Generating client response for simulation ${simulationSettings.simulationId}`);

    // Step 1: Generate the client response
    const { text: clientResponse } = await generateText({
      model: openai('gpt-4o', { apiKey: effectiveApiKey }),
      messages: formattedMessages,
      temperature: 0.7,
      maxTokens: 1000,
    });

    // Step 2: Evaluate objectives if we have enough messages
    let objectiveProgress = null;
    if (messages.length > 2) {
      try {
        objectiveProgress = await evaluateObjectivesWithOpenAI(messages, effectiveApiKey);
      } catch (error) {
        console.error('[CHAT] Error evaluating objectives:', error);
      }
    }

    console.log(`[CHAT] Successfully generated response for simulation ${simulationSettings.simulationId}`);

    return res.json({
      success: true,
      message: clientResponse,
      objectiveProgress,
      source: 'openai',
    });
  } catch (error) {
    console.error('[CHAT] Error generating client response:', error);
    return res.status(500).json({
      success: false,
      message: "I'm sorry, I'm having trouble responding right now. Let's continue our conversation in a moment.",
      objectiveProgress: null,
    });
  }
});

// POST /api/chat/expert-response - Generate expert guidance
router.post('/expert-response', async (req: express.Request, res: express.Response) => {
  try {
    const { messages, clientProfile, personalitySettings, simulationSettings, objectives, apiKey } = req.body;

    // Try Azure agents first if available
    if (areAgentsAvailable()) {
      try {
        console.log('[CHAT] Using Azure agent for expert guidance');

        const result = await expertGuidanceAgent.generateGuidance({
          messages,
          clientProfile,
          personalitySettings: personalitySettings || {
            mood: 'neutral',
            archetype: 'Standard Client',
            traits: {},
            influence: 'balanced',
          },
          simulationSettings,
          objectives,
          sessionId: simulationSettings?.simulationId || `session-${Date.now()}`,
        });

        if (result.success) {
          console.log('[CHAT] Azure agent succeeded for expert guidance');
          return res.json({
            success: true,
            message: result.message,
            tier: result.tier,
            source: 'azure',
          });
        }

        console.warn('[CHAT] Azure agent failed, falling back to OpenAI');
      } catch (error) {
        console.error('[CHAT] Azure agent error:', error);
        console.warn('[CHAT] Falling back to OpenAI');
      }
    }

    // Fallback to OpenAI
    const effectiveApiKey = apiKey || storedApiKey || process.env.OPENAI_API_KEY;

    if (!effectiveApiKey) {
      return res.status(400).json({
        success: false,
        message: 'OpenAI API key is missing. Please configure it in the API Settings page.',
      });
    }

    const expertSystemPrompt = buildExpertPrompt(clientProfile, personalitySettings, simulationSettings, objectives);

    const formattedMessages = [
      { role: 'system', content: expertSystemPrompt },
      ...messages.filter((m: any) => m.role !== 'system'),
    ];

    const { text: expertResponse } = await generateText({
      model: openai('gpt-4o', { apiKey: effectiveApiKey }),
      messages: formattedMessages,
      temperature: 0.7,
      maxTokens: 1000,
    });

    return res.json({
      success: true,
      message: expertResponse,
      tier: 3,
      source: 'openai',
    });
  } catch (error) {
    console.error('[CHAT] Error generating expert response:', error);
    return res.status(500).json({
      success: false,
      message: "I'm sorry, I'm having trouble providing guidance right now. Please try asking a more specific question.",
      tier: 3,
    });
  }
});

// POST /api/chat/set-api-key - Store API key
router.post('/set-api-key', async (req: express.Request, res: express.Response) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey) {
      return res.status(400).json({ success: false, message: 'API key is required' });
    }
    storedApiKey = apiKey;
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to set API key' });
  }
});

// POST /api/chat/test-api-key - Test API key
router.post('/test-api-key', async (req: express.Request, res: express.Response) => {
  try {
    const { apiKey } = req.body;
    const testKey = apiKey || storedApiKey;

    if (!testKey) {
      return res.status(400).json({ success: false, message: 'No API key provided' });
    }

    const { text } = await generateText({
      model: openai('gpt-4o', { apiKey: testKey }),
      prompt: 'Hello, this is a test.',
    });

    return res.json({ success: true, message: 'API key validated successfully' });
  } catch (error) {
    console.error('[CHAT] API key test failed:', error);
    return res.json({
      success: false,
      message: 'Failed to validate API key. Please check and try again.',
    });
  }
});

// Helper function to build system prompt
function buildSystemPrompt(
  clientProfile: any,
  personalitySettings: any,
  simulationSettings: any
): string {
  return `You are an AI client in a training simulation. Your role is to behave as a realistic client with the personality traits, background, and needs specified below. Respond naturally and conversationally, avoiding robotic language or self-references as an AI.

IMPORTANT: You are the CLIENT, not the advisor. Respond as if you are seeking financial advice, not giving it.

Client Profile:
- Name: ${clientProfile.name}
- Age: ${clientProfile.age}
- Occupation: ${clientProfile.occupation}
- Income: ${clientProfile.income}
- Family Status: ${clientProfile.family}
- Goals: ${clientProfile.goals?.join(', ') || 'Not specified'}

Personality:
- Mood: ${personalitySettings.mood}
- Archetype: ${personalitySettings.archetype}

Industry Context: ${simulationSettings.industry}${simulationSettings.subcategory ? ` - ${simulationSettings.subcategory}` : ''}
Difficulty Level: ${simulationSettings.difficulty}

${getDifficultyGuidelines(simulationSettings.difficulty)}

For your first response, introduce yourself briefly with just your name and a general reason for meeting with the advisor. Keep it natural and conversational.

IMPORTANT: Your name is ${clientProfile.name}. Always use this name when introducing yourself.`;
}

function getDifficultyGuidelines(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case 'beginner':
      return `Be friendly, cooperative, and open. Provide information readily when asked. You have basic financial knowledge but need explanations for industry-specific concepts. You should be willing to share your financial details, family situation, and goals when asked directly.`;
    case 'intermediate':
      return `Be somewhat reserved and hesitant to share all information immediately. Some of your financial details and goals should only be revealed when asked specifically or when trust is established. You have moderate financial knowledge. Do not volunteer detailed financial information unless specifically asked.`;
    case 'advanced':
      return `Be skeptical, challenging, and resistant initially. You should question recommendations, raise objections, and only reveal sensitive information after significant trust-building. You have substantial financial knowledge but may have misconceptions that need correction. Be very guarded with your information and require the advisor to demonstrate expertise before opening up.`;
    default:
      return `Be friendly and cooperative, with a balanced approach to sharing information.`;
  }
}

function buildExpertPrompt(
  clientProfile: any,
  personalitySettings: any,
  simulationSettings: any,
  objectives: any[]
): string {
  const competenciesText = Array.isArray(simulationSettings.competencies)
    ? simulationSettings.competencies.join(', ')
    : 'None specified';

  return `You are an expert financial advisor trainer providing guidance to an advisor in a simulation.
The advisor is practicing with a simulated client and has asked for your help.

Client Profile:
- Name: ${clientProfile.name || 'Unknown'}
- Age: ${clientProfile.age || 'Unknown'}
- Occupation: ${clientProfile.occupation || 'Unknown'}
- Goals: ${Array.isArray(clientProfile.goals) ? clientProfile.goals.join(', ') : 'Unknown'}

Industry Context: ${simulationSettings.industry || 'Unknown'}${simulationSettings.subcategory ? ` - ${simulationSettings.subcategory}` : ''}
Difficulty Level: ${simulationSettings.difficulty || 'Unknown'}

Competencies Being Evaluated: ${competenciesText}

Current Objectives Progress:
${objectives && Array.isArray(objectives) ? objectives.map((obj) => `- ${obj.name}: ${obj.progress}% complete`).join('\n') : 'No objectives data available'}

Provide clear, practical, and supportive guidance to help the advisor succeed in this simulation.

Remember that you are NOT the client - you are a trainer helping the advisor.`;
}

/**
 * Helper function to evaluate objectives using OpenAI
 */
async function evaluateObjectivesWithOpenAI(messages: any[], apiKey?: string): Promise<any> {
  if (!apiKey) {
    console.warn('[CHAT] No API key for objective evaluation');
    return null;
  }

  const objectiveTrackingMessages = [
    {
      role: 'system',
      content: `You are an objective evaluator for a financial advisor training simulation.
Evaluate the advisor's performance based on the conversation history below.
The advisor is the user, and the client is the assistant.
Assess progress on these objectives:
1. Building Rapport: Establishing a connection with the client
2. Needs Assessment: Discovering the client's financial situation and goals
3. Handling Objections: Addressing concerns professionally
4. Providing Recommendations: Suggesting appropriate options based on needs

IMPORTANT SCORING INSTRUCTIONS:
- Scores generally should not decrease unless there is a significant mistake or misstep
- If you must decrease a score, provide a specific reason in the decreaseReason object
- Only decrease scores for serious mistakes
- Base your evaluation on the ENTIRE conversation, not just the last message
- Even brief exchanges that show warmth/professionalism should contribute to rapport (10-30%)
- Any questions about client's situation should contribute to needs assessment (15-40%)

Use the trackObjectiveProgress function to report progress percentages (0-100) on each objective.`,
    },
    ...messages.filter((m: any) => m.role !== 'system'),
  ];

  const objectiveResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: objectiveTrackingMessages,
      temperature: 0.3,
      max_tokens: 500,
      tools: [
        {
          type: 'function',
          function: {
            name: 'trackObjectiveProgress',
            description: 'Track progress on simulation objectives based on the conversation',
            parameters: {
              type: 'object',
              properties: {
                rapport: {
                  type: 'number',
                  description: 'Progress percentage (0-100) on building rapport with the client',
                },
                needs: {
                  type: 'number',
                  description: 'Progress percentage (0-100) on needs assessment',
                },
                objections: {
                  type: 'number',
                  description: 'Progress percentage (0-100) on handling objections',
                },
                recommendations: {
                  type: 'number',
                  description: 'Progress percentage (0-100) on providing recommendations',
                },
                explanation: {
                  type: 'string',
                  description: 'Brief explanation of why these progress values were assigned',
                },
              },
              required: ['rapport', 'needs', 'objections', 'recommendations', 'explanation'],
            },
          },
        },
      ],
      tool_choice: { type: 'function', function: { name: 'trackObjectiveProgress' } },
    }),
  });

  if (objectiveResponse.ok) {
    const data = await objectiveResponse.json();
    if (data.choices?.[0]?.message?.tool_calls?.length > 0) {
      const toolCall = data.choices[0].message.tool_calls[0];
      if (toolCall.function.name === 'trackObjectiveProgress') {
        const progress = JSON.parse(toolCall.function.arguments);
        console.log('[CHAT] Objective progress evaluated:', progress);
        return progress;
      }
    }
  }

  return null;
}

export default router;
