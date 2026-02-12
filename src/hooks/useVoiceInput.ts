'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { createDeepgramSocket, type DeepgramSocket } from '@/lib/deepgram';

// ---------------------------------------------------------------------------
// useVoiceInput — Microphone capture + Deepgram streaming STT
// ---------------------------------------------------------------------------

interface UseVoiceInputReturn {
  /** Whether the microphone is currently capturing audio. */
  isListening: boolean;
  /** Accumulated final transcript text. */
  transcript: string;
  /** Current interim (partial) transcript from Deepgram. */
  interimTranscript: string;
  /** Request mic permission, start capturing, open Deepgram socket. */
  startListening: () => Promise<void>;
  /** Stop capturing, close socket, finalize transcript. */
  stopListening: () => void;
  /** Any error that occurred during voice capture. */
  error: string | null;
}

export function useVoiceInput(): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<DeepgramSocket | null>(null);
  const tokenRef = useRef<string | null>(null);

  // Fetch Deepgram token on first use (cached for the session)
  const getToken = useCallback(async (): Promise<string> => {
    if (tokenRef.current) return tokenRef.current;

    const response = await fetch('/api/deepgram-token', { method: 'POST' });
    if (!response.ok) {
      throw new Error('Failed to fetch Deepgram token');
    }

    const data = (await response.json()) as { token: string };
    tokenRef.current = data.token;
    return data.token;
  }, []);

  const startListening = useCallback(async () => {
    try {
      setError(null);

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      // Fetch Deepgram token
      const token = await getToken();

      // Open Deepgram WebSocket
      const socket = createDeepgramSocket(token, (text, isFinal) => {
        if (isFinal) {
          setTranscript((prev) => {
            const separator = prev.length > 0 ? ' ' : '';
            return prev + separator + text;
          });
          setInterimTranscript('');
        } else {
          setInterimTranscript(text);
        }
      });
      socketRef.current = socket;

      // Start MediaRecorder to capture audio chunks
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });

      mediaRecorder.addEventListener('dataavailable', (event: BlobEvent) => {
        if (event.data.size > 0 && socketRef.current) {
          socketRef.current.send(event.data);
        }
      });

      mediaRecorder.start(250); // Send chunks every 250ms
      mediaRecorderRef.current = mediaRecorder;

      setIsListening(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start voice input';
      setError(message);
      setIsListening(false);
    }
  }, [getToken]);

  const stopListening = useCallback(() => {
    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    // Stop all media tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Close Deepgram socket
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    // Fold any remaining interim text into final transcript
    setInterimTranscript((currentInterim) => {
      if (currentInterim) {
        setTranscript((prev) => {
          const separator = prev.length > 0 ? ' ' : '';
          return prev + separator + currentInterim;
        });
      }
      return '';
    });

    setIsListening(false);
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    error,
  };
}
