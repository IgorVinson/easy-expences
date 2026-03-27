import { initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

initializeApp();
const db = getFirestore();

const RATE_LIMIT_PER_MINUTE = 5;
const RATE_LIMIT_PER_HOUR = 50;
const BASIC_VOICE_LIMIT_PER_MONTH = 30;

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const DAILY_HARD_LIMIT = 200;

async function checkDailyLimit(userId: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const ref = db.collection('rateLimits').doc(userId);

  await db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    const data = doc.data() ?? {};

    const dailyCount = data.dailyDate === today ? (data.dailyCount ?? 0) : 0;

    if (dailyCount >= DAILY_HARD_LIMIT) {
      throw new HttpsError(
        'resource-exhausted',
        'Daily recording limit reached. Please try again tomorrow.'
      );
    }

    tx.set(
      ref,
      {
        dailyCount: dailyCount + 1,
        dailyDate: today,
      },
      { merge: true }
    );
  });
}

async function checkVoiceLimit(userId: string): Promise<void> {
  const ref = db.collection('subscriptions').doc(userId);
  const snap = await ref.get();

  if (!snap.exists) {
    throw new HttpsError(
      'permission-denied',
      'No subscription found. Please subscribe to use voice recording.'
    );
  }

  const data = snap.data()!;
  const tier: string = data.tier ?? (data.isPro === true ? 'premium' : 'none');

  // Premium and trial users bypass limit
  if (tier === 'premium' || tier === 'trial') return;

  // Basic users have 30/month limit
  if (tier === 'basic') {
    const currentMonth = getCurrentMonth();
    const resetMonth: string = data.voiceRecordingsResetMonth ?? currentMonth;
    const count: number = resetMonth === currentMonth ? (data.voiceRecordingsThisMonth ?? 0) : 0;

    if (count >= BASIC_VOICE_LIMIT_PER_MONTH) {
      throw new HttpsError(
        'resource-exhausted',
        'Basic tier monthly voice limit reached. Upgrade to Premium for unlimited recordings.'
      );
    }
    return;
  }

  // No subscription
  throw new HttpsError(
    'permission-denied',
    'Active subscription required. Please subscribe to use voice recording.'
  );
}

async function checkRateLimit(userId: string): Promise<void> {
  const now = Date.now();
  const ref = db.collection('rateLimits').doc(userId);

  await db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    const data = doc.data() ?? {};

    const minuteWindowStart: number = data.minuteWindowStart?.toMillis() ?? 0;
    const hourWindowStart: number = data.hourWindowStart?.toMillis() ?? 0;

    const minuteCount = now - minuteWindowStart < 60_000 ? (data.minuteCount ?? 0) : 0;
    const hourCount = now - hourWindowStart < 3_600_000 ? (data.hourCount ?? 0) : 0;

    if (minuteCount >= RATE_LIMIT_PER_MINUTE) {
      throw new HttpsError('resource-exhausted', 'Too many requests. Please wait a minute.');
    }
    if (hourCount >= RATE_LIMIT_PER_HOUR) {
      throw new HttpsError('resource-exhausted', 'Hourly limit reached. Please try again later.');
    }

    tx.set(ref, {
      minuteCount: minuteCount + 1,
      minuteWindowStart: minuteCount === 0 ? Timestamp.fromMillis(now) : data.minuteWindowStart,
      hourCount: hourCount + 1,
      hourWindowStart: hourCount === 0 ? Timestamp.fromMillis(now) : data.hourWindowStart,
    });
  });
}

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
  return raw
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
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

    await checkRateLimit(request.auth.uid);
    await checkDailyLimit(request.auth.uid);
    await checkVoiceLimit(request.auth.uid);

    const { audioBase64, mimeType, categories } = request.data as ProcessVoiceExpenseRequest;

    if (!audioBase64 || !mimeType) {
      throw new HttpsError('invalid-argument', 'audioBase64 and mimeType are required.');
    }

    // ~1MB base64 ≈ 45 seconds of HIGH_QUALITY audio — hard server-side limit
    if (audioBase64.length > 1_048_576) {
      throw new HttpsError('invalid-argument', 'Audio recording exceeds the maximum allowed size.');
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
      responseData?.candidates?.[0]?.content?.parts?.find((p) => typeof p?.text === 'string')
        ?.text ?? '';

    if (!modelText) {
      throw new HttpsError('internal', 'Gemini returned an empty response.');
    }

    return parseVoiceExpense(modelText);
  }
);
