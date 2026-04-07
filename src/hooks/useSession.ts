'use client';

import { useState, useCallback, useRef } from 'react';
import type { KnowledgeFileType } from '@/types/knowledge';
import type { RuneStreamEvent } from '@/types/stream';

// ---------------------------------------------------------------------------
// useSession — Manages a Rune conversation session
// ---------------------------------------------------------------------------

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface SessionKBOperation {
  id: string;
  operationType: 'create' | 'update' | 'activate';
  fileType: KnowledgeFileType;
  title: string;
  contentPreview: string;
  status: 'done' | 'failed';
}

export interface SynthesisResult {
  id: string;
  summary: string;
  entities: Array<{ name: string; type: string; description: string }>;
  backlogItems: Array<{ type: string; content: string }>;
  workspaceFiles: Array<{ room: string; category: string; title: string }>;
  timestamp: string;
}

interface UseSessionReturn {
  messages: ConversationMessage[];
  kbOperations: SessionKBOperation[];
  synthesisResults: SynthesisResult[];
  dismissSynthesis: (id: string) => void;
  sendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

let messageCounter = 0;

function createMessageId(): string {
  messageCounter += 1;
  return `msg-${Date.now()}-${messageCounter}`;
}

let synthesisCounter = 0;

function parseStreamEvents(buffer: string): {
  events: RuneStreamEvent[];
  remainder: string;
} {
  const chunks = buffer.split('\n\n');
  const remainder = chunks.pop() ?? '';
  const events: RuneStreamEvent[] = [];

  for (const chunk of chunks) {
    const dataLine = chunk
      .split('\n')
      .find((line) => line.startsWith('data: '));

    if (!dataLine) continue;

    try {
      events.push(JSON.parse(dataLine.slice(6)) as RuneStreamEvent);
    } catch (error) {
      console.error('[useSession] Failed to parse stream event:', error, dataLine);
    }
  }

  return { events, remainder };
}

export function useSession(bookId: string, sessionId: string): UseSessionReturn {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [kbOperations, setKbOperations] = useState<SessionKBOperation[]>([]);
  const [synthesisResults, setSynthesisResults] = useState<SynthesisResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const exchangeCountRef = useRef(0);

  const dismissSynthesis = useCallback((id: string) => {
    setSynthesisResults((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      setError(null);
      setIsLoading(true);

      const userMessage: ConversationMessage = {
        id: createMessageId(),
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
      };

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

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parsed = parseStreamEvents(buffer);
          buffer = parsed.remainder;

          for (const event of parsed.events) {
            if (event.type === 'text_delta') {
              accumulated += event.text;
              const currentAccumulated = accumulated;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: currentAccumulated }
                    : msg,
                ),
              );
              continue;
            }

            if (event.type === 'kb_operation') {
              setKbOperations((prev) => {
                const next = [
                  {
                    id: event.id,
                    operationType: event.operationType,
                    fileType: event.fileType,
                    title: event.title,
                    contentPreview: event.contentPreview,
                    status: event.status,
                  },
                  ...prev.filter((item) => item.id !== event.id),
                ];

                return next.slice(0, 6);
              });
              continue;
            }

            if (event.type === 'error') {
              setError(event.message);
            }
          }
        }

        exchangeCountRef.current += 1;
        if (exchangeCountRef.current % 3 === 0 && accumulated.length > 0) {
          // Synthesize — capture results for summary card
          fetch('/api/synthesize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ book_id: bookId, session_id: sessionId }),
          })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
              if (data?.summary) {
                synthesisCounter += 1;
                setSynthesisResults((prev) => [
                  {
                    id: `synthesis-${Date.now()}-${synthesisCounter}`,
                    summary: data.summary as string,
                    entities: (data.entities ?? []) as SynthesisResult['entities'],
                    backlogItems: (data.backlog_items ?? []) as SynthesisResult['backlogItems'],
                    workspaceFiles: (data.workspace_files ?? []) as SynthesisResult['workspaceFiles'],
                    timestamp: new Date().toISOString(),
                  },
                  ...prev,
                ]);
              }
            })
            .catch((err) => {
              console.error('[useSession] Background synthesize failed:', err);
            });

          // Extract — still fire-and-forget
          fetch('/api/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: accumulated,
              book_id: bookId,
              session_id: sessionId,
            }),
          }).catch((err) => {
            console.error('[useSession] Background extract failed:', err);
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send message';
        setError(message);
        setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
      } finally {
        setIsLoading(false);
      }
    },
    [bookId, sessionId],
  );

  return {
    messages,
    kbOperations,
    synthesisResults,
    dismissSynthesis,
    sendMessage,
    isLoading,
    error,
  };
}
