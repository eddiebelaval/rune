'use client';

import { useState, useCallback, useRef } from 'react';

// ---------------------------------------------------------------------------
// useSession — Manages a Rune conversation session
// ---------------------------------------------------------------------------

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface UseSessionReturn {
  /** All messages in the current conversation. */
  messages: ConversationMessage[];
  /** Send a user message and stream the AI response. */
  sendMessage: (text: string) => Promise<void>;
  /** Whether a response is currently being streamed. */
  isLoading: boolean;
  /** Any error from the last sendMessage call. */
  error: string | null;
}

let messageCounter = 0;

function createMessageId(): string {
  messageCounter += 1;
  return `msg-${Date.now()}-${messageCounter}`;
}

/**
 * Fire background post-session processing (synthesize + extract).
 * Non-blocking — results flow back via Supabase Realtime subscriptions.
 */
function triggerPostSessionProcessing(
  bookId: string,
  sessionId: string,
  assistantResponse: string,
): void {
  // Synthesize: generates session summary, backlog items, workspace files
  fetch('/api/synthesize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ book_id: bookId, session_id: sessionId }),
  }).catch((err) => {
    console.error('[useSession] Background synthesize failed:', err);
  });

  // Extract: builds knowledge graph entities and relationships
  fetch('/api/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: assistantResponse,
      book_id: bookId,
      session_id: sessionId,
    }),
  }).catch((err) => {
    console.error('[useSession] Background extract failed:', err);
  });
}

export function useSession(bookId: string, sessionId: string): UseSessionReturn {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const exchangeCountRef = useRef(0);

  const sendMessage = useCallback(
    async (text: string) => {
      setError(null);
      setIsLoading(true);

      // Add the user message immediately
      const userMessage: ConversationMessage = {
        id: createMessageId(),
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
      };

      // Create a placeholder for the assistant response
      const assistantMessageId = createMessageId();
      const assistantMessage: ConversationMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);

      try {
        const response = await fetch('/api/converse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            book_id: bookId,
            session_id: sessionId,
            message: text,
          }),
        });

        if (!response.ok) {
          throw new Error(`Converse API error: ${response.status} ${response.statusText}`);
        }

        if (!response.body) {
          throw new Error('Response body is null — streaming not supported');
        }

        // Read the streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;

          // Update the assistant message with accumulated text
          const currentAccumulated = accumulated;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: currentAccumulated }
                : msg,
            ),
          );
        }

        // After streaming completes, trigger background processing
        // every 3 exchanges to avoid excessive API calls
        exchangeCountRef.current += 1;
        if (exchangeCountRef.current % 3 === 0 && accumulated.length > 0) {
          triggerPostSessionProcessing(bookId, sessionId, accumulated);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send message';
        setError(message);

        // Remove the empty assistant placeholder on error
        setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
      } finally {
        setIsLoading(false);
      }
    },
    [bookId, sessionId],
  );

  return {
    messages,
    sendMessage,
    isLoading,
    error,
  };
}
