import { GoogleGenerativeAI } from '@google/generative-ai';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

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

      // Safeguard: Ensure no old recording exists
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch {
          // Ignore if it was already stopped
        }
        recordingRef.current = null;
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
      recordingRef.current = null;
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
      let base64Audio: string;
      let mimeType = 'audio/m4a';

      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        mimeType = blob.type || 'audio/webm';
        
        base64Audio = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve(base64 || '');
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        base64Audio = await FileSystem.readAsStringAsync(uri, {
          encoding: 'base64',
        });
      }

      console.log(`Audio recording Base64 length: ${base64Audio.length}`);
      console.log(`Audio mime type: ${mimeType}`);

      // Call Gemini API to extract the information
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
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
            mimeType,
            data: base64Audio
          }
        }
      ]);

      const textResponse = result.response.text();
      console.log('Gemini Raw Text Response:', textResponse);

      // Extract JSON using a robust regex match
      const match = textResponse.match(/\{[\s\S]*\}/);
      const cleanedJSON = match ? match[0] : textResponse;
      
      console.log('Parsed JSON string:', cleanedJSON);
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  return {
    isRecording,
    isProcessing,
    startRecording,
    stopRecordingAndProcess,
    cancelRecording
  };
}
