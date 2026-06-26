import {
  ExpoSpeechRecognitionModule,
  type ExpoSpeechRecognitionResultEvent,
  type ExpoSpeechRecognitionErrorEvent,
} from 'expo-speech-recognition';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Vibration } from 'react-native';

// Live, on-device speech recognition for the expense form. Streams interim
// transcripts so the caller can fill the form fields as the user talks — no
// audio upload, no LLM call. Mirrors a small slice of useVoiceExpense's shape.

type TranscriptListener = (transcript: string, isFinal: boolean) => void;

// Map our i18n language codes to BCP-47 locales the recognizer understands.
const LOCALE_BY_LANG: Record<string, string> = {
  en: 'en-US',
  es: 'es-ES',
  ua: 'uk-UA',
};

export function localeForLanguage(lang: string | undefined): string {
  return LOCALE_BY_LANG[lang ?? 'en'] ?? 'en-US';
}

export function isLiveRecognitionAvailable(): boolean {
  try {
    return ExpoSpeechRecognitionModule.isRecognitionAvailable();
  } catch {
    return false;
  }
}

export function useVoiceExpenseLive() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onTranscriptRef = useRef<TranscriptListener | null>(null);
  const subscriptionsRef = useRef<{ remove: () => void }[]>([]);

  const clearSubscriptions = useCallback(() => {
    subscriptionsRef.current.forEach((sub) => sub.remove());
    subscriptionsRef.current = [];
  }, []);

  useEffect(() => clearSubscriptions, [clearSubscriptions]);

  const stopListening = useCallback(() => {
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {
      // already stopped
    }
    Vibration.vibrate([0, 30, 80, 30]); // double buzz = stopped
    setIsListening(false);
  }, []);

  const cancel = useCallback(() => {
    try {
      ExpoSpeechRecognitionModule.abort();
    } catch {
      // already stopped
    }
    clearSubscriptions();
    onTranscriptRef.current = null;
    setIsListening(false);
    setTranscript('');
  }, [clearSubscriptions]);

  const startListening = useCallback(
    async (onTranscript: TranscriptListener, lang?: string): Promise<boolean> => {
      setError(null);
      setTranscript('');
      onTranscriptRef.current = onTranscript;

      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        setError('Microphone and speech permission are required.');
        return false;
      }

      clearSubscriptions();
      subscriptionsRef.current = [
        ExpoSpeechRecognitionModule.addListener('result', (event: ExpoSpeechRecognitionResultEvent) => {
          const text = event.results?.[0]?.transcript ?? '';
          setTranscript(text);
          onTranscriptRef.current?.(text, event.isFinal);
        }),
        ExpoSpeechRecognitionModule.addListener('error', (event: ExpoSpeechRecognitionErrorEvent) => {
          setError(event.message || 'Speech recognition failed.');
          setIsListening(false);
        }),
        ExpoSpeechRecognitionModule.addListener('end', () => {
          setIsListening(false);
          clearSubscriptions();
        }),
      ];

      try {
        ExpoSpeechRecognitionModule.start({
          lang: localeForLanguage(lang),
          interimResults: true,
          // Keep listening through pauses until the user taps stop.
          continuous: true,
        });
        Vibration.vibrate(40); // single buzz = listening started
        setIsListening(true);
        return true;
      } catch (err) {
        console.error('Failed to start speech recognition', err);
        setError(err instanceof Error ? err.message : 'Failed to start listening.');
        clearSubscriptions();
        setIsListening(false);
        return false;
      }
    },
    [clearSubscriptions]
  );

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    cancel,
  };
}
