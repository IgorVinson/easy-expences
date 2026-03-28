import {
  AudioQuality,
  getRecordingPermissionsAsync,
  IOSOutputFormat,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
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
const VOICE_RECORDING_PRESET = {
  ...RecordingPresets.LOW_QUALITY,
  sampleRate: 24_000,
  numberOfChannels: 1,
  bitRate: 32_000,
  ios: {
    ...RecordingPresets.LOW_QUALITY.ios,
    sampleRate: 24_000,
    outputFormat: IOSOutputFormat.MPEG4AAC,
    audioQuality: AudioQuality.LOW,
  },
  web: {
    ...RecordingPresets.LOW_QUALITY.web,
    bitsPerSecond: 64_000,
  },
} as const;

export function useVoiceExpense() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recorder = useAudioRecorder(VOICE_RECORDING_PRESET);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasRecordingPermissionRef = useRef(false);
  const isPreparedRef = useRef(false);

  const clearAutoStopTimer = () => {
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
  };

  const ensurePermission = useCallback(async () => {
    if (hasRecordingPermissionRef.current) return;

    const permission = await requestRecordingPermissionsAsync();
    if (permission.status !== 'granted') {
      throw new Error('Microphone permission was denied.');
    }

    hasRecordingPermissionRef.current = true;
  }, []);

  const prewarmRecorder = useCallback(async () => {
    if (isRecording || isProcessing) return;
    const permission = await getRecordingPermissionsAsync();
    if (permission.status !== 'granted') return;
    hasRecordingPermissionRef.current = true;
    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
    });
    try {
      await recorder.prepareToRecordAsync();
      isPreparedRef.current = true;
    } catch (err: any) {
      if (!err?.message?.includes('already been prepared')) throw err;
      isPreparedRef.current = true;
    }
  }, [isProcessing, isRecording, recorder]);

  const startRecording = useCallback(
    async (onAutoStop?: () => void) => {
      try {
        setError(null);
        if (!isPreparedRef.current) {
          await ensurePermission();
          await setAudioModeAsync({
            allowsRecording: true,
            playsInSilentMode: true,
          });
          try {
            await recorder.prepareToRecordAsync();
            isPreparedRef.current = true;
          } catch (err: any) {
            if (err?.message?.includes('already been prepared')) {
              isPreparedRef.current = true;
            } else throw err;
          }
        }
        recorder.record();
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
    },
    [ensurePermission, recorder]
  );

  const stopRecordingAndProcess = useCallback(
    async (categories: string[] = []): Promise<VoiceExpenseResult | null> => {
      try {
        setError(null);
        setIsRecording(false);
        clearAutoStopTimer();
        if (!recorder.isRecording) return null;

        await recorder.stop();
        isPreparedRef.current = false;

        const uri = recorder.uri ?? recorder.getStatus().url;
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
        await setAudioModeAsync({
          allowsRecording: false,
        });
        setIsProcessing(false);
      }
    },
    [recorder]
  );

  const cancelRecording = useCallback(async () => {
    clearAutoStopTimer();
    if (recorder.isRecording) {
      await recorder.stop();
    }
    isPreparedRef.current = false;
    await setAudioModeAsync({
      allowsRecording: false,
    });
    setIsRecording(false);
    setIsProcessing(false);
  }, [recorder]);

  return {
    isRecording,
    isProcessing,
    error,
    prewarmRecorder,
    startRecording,
    stopRecordingAndProcess,
    cancelRecording,
  };
}
