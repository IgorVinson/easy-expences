import { defineSecret } from 'firebase-functions/params';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

const geminiApiKey = defineSecret('GEMINI_API_KEY');

const GEMINI_MODEL_CANDIDATES = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-flash-latest',
];

interface ProcessVoiceExpenseRequest {
  audioBase64: string;
  mimeType: string;
  categories: string[];
}

interface ProcessVoiceExpenseResponse {
  transcript: string;
  title: string;
  amount: number;
  category: string;
}

function normalizeModelJson(raw: string): string {
  return raw.replace(/```json/gi, '').replace(/```/g, '').trim();
}

function parseVoiceExpense(rawResponse: string): ProcessVoiceExpenseResponse {
  const normalized = normalizeModelJson(rawResponse);
  const parsed = JSON.parse(normalized);
  return {
    transcript: typeof parsed.transcript === 'string' ? parsed.transcript.trim() : '',
    title: typeof parsed.title === 'string' ? parsed.title.trim() : '',
    amount: Number(parsed.amount) > 0 ? Number(parsed.amount) : 0,
    category: typeof parsed.category === 'string' ? parsed.category.trim() : '',
  };
}

export const processVoiceExpense = onCall(
  { secrets: [geminiApiKey] },
  async (request): Promise<ProcessVoiceExpenseResponse> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be signed in to use voice expenses.');
    }

    const { audioBase64, mimeType, categories } = request.data as ProcessVoiceExpenseRequest;

    if (!audioBase64 || !mimeType) {
      throw new HttpsError('invalid-argument', 'audioBase64 and mimeType are required.');
    }

    const apiKey = geminiApiKey.value();
    const categoryList = categories.length > 0 ? categories.join(', ') : 'General';

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `You are an expense tracker assistant.
Transcribe this audio and extract a single expense.
Available categories: ${categoryList}
Return strictly valid JSON only in this shape:
{
  "transcript": "full user speech transcript",
  "title": "short expense title",
  "amount": number,
  "category": "best matching category name from the available list"
}
Rules:
- amount must be a positive number with no currency symbols.
- category must exactly match one of the available categories.
- If unclear, infer best effort values.
- Never return markdown or extra text.`,
            },
            {
              inlineData: {
                mimeType,
                data: audioBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    };

    let data: unknown = null;
    let lastError = '';

    for (const model of GEMINI_MODEL_CANDIDATES) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        }
      );

      if (response.ok) {
        data = await response.json();
        lastError = '';
        break;
      }

      const errorText = await response.text();
      lastError = `Model ${model} failed (${response.status}): ${errorText}`;

      if (response.status !== 404) {
        break;
      }
    }

    if (!data) {
      throw new HttpsError('internal', `Gemini request failed. ${lastError}`);
    }

    const responseData = data as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const modelText: string =
      responseData?.candidates?.[0]?.content?.parts?.find(
        (p) => typeof p?.text === 'string'
      )?.text ?? '';

    if (!modelText) {
      throw new HttpsError('internal', 'Gemini returned an empty response.');
    }

    return parseVoiceExpense(modelText);
  }
);
