import 'server-only';

import ModelClient from '@azure-rest/ai-inference';
import { AzureKeyCredential } from '@azure/core-auth';
import type { Allergen } from '@/types';

const endpoint = process.env.AZURE_AI_FOUNDRY_ENDPOINT ?? '';
const apiKey = process.env.AZURE_AI_FOUNDRY_API_KEY ?? '';
const modelName = process.env.AZURE_AI_FOUNDRY_MODEL_NAME ?? 'gpt-4';

/** Singleton AI Foundry client */
let aiClient: ReturnType<typeof ModelClient> | null = null;

function getClient(): ReturnType<typeof ModelClient> {
  if (!aiClient) {
    if (!endpoint || !apiKey) {
      throw new Error('AZURE_AI_FOUNDRY_ENDPOINT and AZURE_AI_FOUNDRY_API_KEY must be set');
    }
    aiClient = ModelClient(endpoint, new AzureKeyCredential(apiKey));
  }
  return aiClient;
}

const SYSTEM_PROMPT = `You are a helpful allergen safety advisor for people with food allergies and intolerances.

Given a user's allergen list (with severity: "allergy" means potentially life-threatening, "intolerance" means causes discomfort) and a food/restaurant query, provide clear, cautious dining guidance including:
- Specific dishes or ingredients to AVOID
- Safer alternatives that are typically free of their allergens
- General precautions when dining

If the query is not food-related, nonsensical, or you cannot provide allergen guidance for it, politely explain that you can only help with food and dining-related allergen questions.

Always be cautious and err on the side of safety. Never guarantee that any dish is completely safe.`;

/**
 * Get personalized allergen guidance from Azure AI Foundry.
 *
 * @param allergens - The user's current allergen list with severity labels
 * @param foodQuery - The user's free-text food or restaurant query
 * @returns The AI-generated guidance text
 * @throws Error if the AI service is unavailable
 */
export async function getAllergyGuidance(
  allergens: Allergen[],
  foodQuery: string,
): Promise<string> {
  const client = getClient();

  const allergenList = allergens.map((a) => `${a.name} (${a.severity})`).join(', ');

  const userMessage = `My allergens: ${allergenList}\n\nFood/Restaurant query: ${foodQuery}`;

  const response = await client.path('/chat/completions').post({
    body: {
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      model: modelName,
      max_tokens: 1000,
    },
  });

  if (response.status !== '200') {
    throw new Error(`AI Foundry returned status ${response.status}`);
  }

  const body = response.body as { choices?: Array<{ message?: { content?: string } }> };
  const content = body.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('AI Foundry returned empty response');
  }

  return content;
}
