// ---------------------------------------------------------------------------
// Deepgram Browser WebSocket Client
// ---------------------------------------------------------------------------
// Connects to Deepgram's real-time speech-to-text API over WebSocket.
// Browser-only — no Node.js APIs used.
// ---------------------------------------------------------------------------

export interface DeepgramSocket {
  /** Send a chunk of audio data to Deepgram for transcription. */
  send(audioBlob: Blob): void;
  /** Close the WebSocket connection gracefully. */
  close(): void;
}

export interface DeepgramTranscriptMessage {
  type: string;
  channel: {
    alternatives: Array<{
      transcript: string;
      confidence: number;
    }>;
  };
  is_final: boolean;
  speech_final: boolean;
}

/**
 * Create a Deepgram real-time WebSocket connection.
 *
 * @param token - Temporary Deepgram API key (fetched from /api/deepgram-token)
 * @param onTranscript - Callback invoked with each transcript fragment
 * @returns Object with send() and close() methods
 */
export function createDeepgramSocket(
  token: string,
  onTranscript: (text: string, isFinal: boolean) => void,
): DeepgramSocket {
  const params = new URLSearchParams({
    model: 'nova-2',
    language: 'en',
    smart_format: 'true',
    interim_results: 'true',
    punctuate: 'true',
  });

  const url = `wss://api.deepgram.com/v1/listen?${params.toString()}`;
  const ws = new WebSocket(url, ['token', token]);

  ws.addEventListener('open', () => {
    // Connection established — ready to receive audio chunks
  });

  ws.addEventListener('message', (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data as string) as DeepgramTranscriptMessage;

      if (data.type !== 'Results') return;

      const alternative = data.channel?.alternatives?.[0];
      if (!alternative) return;

      const transcript = alternative.transcript;
      if (!transcript) return;

      onTranscript(transcript, data.is_final);
    } catch {
      // Ignore non-JSON or unexpected messages
    }
  });

  ws.addEventListener('error', (event: Event) => {
    console.error('[Deepgram] WebSocket error:', event);
  });

  ws.addEventListener('close', (event: CloseEvent) => {
    if (event.code !== 1000) {
      console.warn(`[Deepgram] WebSocket closed: code=${event.code} reason=${event.reason}`);
    }
  });

  return {
    send(audioBlob: Blob): void {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(audioBlob);
      }
    },

    close(): void {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close(1000, 'Client closed');
      }
    },
  };
}
