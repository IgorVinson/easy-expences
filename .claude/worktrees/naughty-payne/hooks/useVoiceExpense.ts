import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { useCallback, useRef, useState } from 'react';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim() ?? '';
const GEMINI_MODEL_CANDIDATES = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-flash-latest',
];

interface VoiceExpenseResult {
  transcript: string;
  title: string;
  amount: number;
  category: string;
}

function normalizeModelJson(raw: string): string {
  return raw.replace(/```json/gi, '').replace(/```/g, '').trim();
}

function parseVoiceExpense(rawResponse: string): VoiceExpenseResult {
  const normalized = normalizeModelJson(rawResponse);
  const parsed = JSON.parse(normalized);

  return {
    transcript: typeof parsed.transcript === 'string' ? parsed.transcript.trim() : '',
    title: typeof parsed.title === 'string' ? parsed.title.trim() : '',
    amount: Number(parsed.amount) > 0 ? Number(parsed.amount) : 0,
    category: typeof parsed.category === 'string' ? parsed.category.trim() : '',
  };
}

function getAudioMimeType(uri: string): string {
  const extension = uri.split('.').pop()?.toLowerCase();
  if (extension === 'wav') return 'audio/wav';
  if (extension === 'mp3') return 'audio/mpeg';
  if (extension === 'aac') return 'audio/aac';
  if (extension === '3gp') return 'audio/3gpp';
  return 'audio/mp4';
}

export function useVoiceExpense() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);

      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        throw new Error('Microphone permission was denied.');
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      return true;
    } catch (err) {
      console.error('Failed to start recording', err);
      setIsRecording(false);
      setError(err instanceof Error ? err.message : 'Failed to start recording.');
      return false;
    }
  }, []);

  const stopRecordingAndProcess = useCallback(async (): Promise<VoiceExpenseResult | null> => {
    try {
      setError(null);
      setIsRecording(false);
      const recording = recordingRef.current;
      if (!recording) return null;

      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      recordingRef.current = null;

      const uri = recording.getURI();
      if (!uri) return null;

      if (!GEMINI_API_KEY) {
        throw new Error('Missing EXPO_PUBLIC_GEMINI_API_KEY.');
      }

      setIsProcessing(true);

      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: `You are an expense tracker assistant.
Transcribe this audio and extract a single expense.
Return strictly valid JSON only in this shape:
{
  "transcript": "full user speech transcript",
  "title": "short expense title",
  "amount": number,
  "category": "best matching category name"
}
Rules:
- amount must be a positive number with no currency symbols.
- If unclear, infer best effort values.
- Never return markdown or extra text.`,
              },
              {
                inlineData: {
                  mimeType: getAudioMimeType(uri),
                  data: base64Audio,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      };

      let data: any = null;
      let requestError = '';

      for (const model of GEMINI_MODEL_CANDIDATES) {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          }
        );

        if (response.ok) {
          data = await response.json();
          requestError = '';
          break;
        }

        const errorText = await response.text();
        requestError = `Model ${model} failed (${response.status}): ${errorText}`;

        // Continue trying fallback models only for model-not-found style errors.
        if (response.status !== 404) {
          break;
        }
      }

      if (!data) {
        throw new Error(`Gemini request failed. ${requestError}`);
      }

      const modelText: string =
        data?.candidates?.[0]?.content?.parts?.find((part: any) => typeof part?.text === 'string')
          ?.text ?? '';

      if (!modelText) {
        throw new Error('Gemini returned an empty response.');
      }

      return parseVoiceExpense(modelText);

    } catch (err) {
      console.error('Failed to process voice expense:', err);
      setError(err instanceof Error ? err.message : 'Failed to process voice expense.');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const cancelRecording = useCallback(async () => {
    if (recordingRef.current) {
      await recordingRef.current.stopAndUnloadAsync();
      recordingRef.current = null;
    }
    setIsRecording(false);
    setIsProcessing(false);
  }, []);

  return {
    isRecording,
    isProcessing,
    error,
    startRecording,
    stopRecordingAndProcess,
    cancelRecording,
  };
}
