import { GoogleGenerativeAI } from '@google/generative-ai';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useCallback, useRef, useState } from 'react';

// You will need to add your Gemini API Key directly here for testing, or via process.env.EXPO_PUBLIC_GEMINI_API_KEY
// e.g. EXPO_PUBLIC_GEMINI_API_KEY=your_api_key in .env file
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

interface VoiceExpenseResult {
  title: string;
  amount: number;
  category: string;
}

export function useVoiceExpense() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const startRecording = useCallback(async () => {
    try {
      if (!GEMINI_API_KEY) {
        console.warn('Gemini API Key is missing. Please set EXPO_PUBLIC_GEMINI_API_KEY in your .env file.');
      }

      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        console.warn('Microphone permission not granted');
        return;
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
    } catch (err) {
      console.error('Failed to start recording', err);
      setIsRecording(false);
    }
  }, []);

  const stopRecordingAndProcess = useCallback(async (): Promise<VoiceExpenseResult | null> => {
    try {
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

      setIsProcessing(true);

      // Read the audio file as base64 string
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Call Gemini API to extract the information
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const prompt = `
        You are an expense tracker assistant.
        Listen to the following audio and extract the expense information.
        Return the information strictly as a JSON object with no additional formatting or markdown:
        {
          "title": "A short, concise title for the expense",
          "amount": number (just the amount),
          "category": "The best matching category from common budget categories (e.g. Food, Transport, Utilities, Entertainment, Health, Shopping, Others)"
        }
      `;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: 'audio/m4a',
            data: base64Audio
          }
        }
      ]);

      const textResponse = result.response.text();
      // Parse the JSON. We might need to handle markdown blocks if Gemini formats it despite instructions
      const cleanedJSON = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const parsedData = JSON.parse(cleanedJSON);
      return {
        title: parsedData.title || '',
        amount: parsedData.amount ? Number(parsedData.amount) : 0,
        category: parsedData.category || ''
      };

    } catch (err) {
      console.error('Failed to process voice expense:', err);
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
  }, []);

  return {
    isRecording,
    isProcessing,
    startRecording,
    stopRecordingAndProcess,
    cancelRecording
  };
}
