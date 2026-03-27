import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { httpsCallable } from 'firebase/functions';
import { useCallback, useRef, useState } from 'react';
import { functions } from '../firebaseConfig';

interface VoiceExpenseResult {
  transcript: string;
  title: string;
  amount: number;
  category: string;
}

interface ProcessVoiceExpenseRequest {
  audioBase64: string;
  mimeType: string;
  categories: string[];
}

function getAudioMimeType(uri: string): string {
  const extension = uri.split('.').pop()?.toLowerCase();
  if (extension === 'wav') return 'audio/wav';
  if (extension === 'mp3') return 'audio/mpeg';
  if (extension === 'aac') return 'audio/aac';
  if (extension === '3gp') return 'audio/3gpp';
  return 'audio/mp4';
}

const processVoiceExpenseFn = httpsCallable<ProcessVoiceExpenseRequest, VoiceExpenseResult>(
  functions,
  'processVoiceExpense'
);

const RECORDING_LIMIT_MS = 30_000;

export function useVoiceExpense() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAutoStopTimer = () => {
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
  };

  const startRecording = useCallback(async (onAutoStop?: () => void) => {
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

      if (onAutoStop) {
        autoStopTimerRef.current = setTimeout(onAutoStop, RECORDING_LIMIT_MS);
      }

      return true;
    } catch (err) {
      console.error('Failed to start recording', err);
      setIsRecording(false);
      setError(err instanceof Error ? err.message : 'Failed to start recording.');
      return false;
    }
  }, []);

  const stopRecordingAndProcess = useCallback(
    async (categories: string[] = []): Promise<VoiceExpenseResult | null> => {
      try {
        setError(null);
        setIsRecording(false);
        clearAutoStopTimer();
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

        const base64Audio = await FileSystem.readAsStringAsync(uri, {
          encoding: 'base64',
        });

        const result = await processVoiceExpenseFn({
          audioBase64: base64Audio,
          mimeType: getAudioMimeType(uri),
          categories,
        });

        return result.data;
      } catch (err) {
        console.error('Failed to process voice expense:', err);
        setError(err instanceof Error ? err.message : 'Failed to process voice expense.');
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  const cancelRecording = useCallback(async () => {
    clearAutoStopTimer();
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
