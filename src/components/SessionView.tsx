'use client';

import { useSession } from '@/hooks/useSession';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useBacklog } from '@/hooks/useBacklog';
import type { BookType, QualityLevel } from '@/types/database';
import MessageArea from '@/components/MessageArea';
import VoiceInput from '@/components/VoiceInput';
import ActivityStream from '@/components/ActivityStream';

// ---------------------------------------------------------------------------
// SessionView — Main writing session: conversation + activity sidebar
// ---------------------------------------------------------------------------

interface SessionViewProps {
  bookId: string;
  sessionId: string;
  bookType: BookType;
  qualityLevel: QualityLevel;
  title: string;
}

export default function SessionView({
  bookId,
  sessionId,
  title,
}: SessionViewProps) {
  const { messages, sendMessage, isLoading } = useSession(bookId, sessionId);
  const { rooms } = useWorkspace(bookId);
  const { items: backlogItems, nextItem } = useBacklog(bookId);

  return (
    <div
      className="flex h-screen"
      style={{ backgroundColor: 'var(--rune-bg)' }}
    >
      {/* LEFT panel — Conversation (65%) */}
      <div
        className="flex flex-col"
        style={{
          width: '65%',
          borderRight: '1px solid var(--rune-border)',
        }}
      >
        {/* Session header */}
        <div
          className="flex items-center px-6 py-3 shrink-0"
          style={{ borderBottom: '1px solid var(--rune-border)' }}
        >
          <h1
            className="text-base tracking-tight"
            style={{
              color: 'var(--rune-heading)',
              fontFamily: 'var(--font-heading, "Source Serif 4", serif)',
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </h1>
        </div>

        {/* Message area (fills remaining space) */}
        <MessageArea messages={messages} isLoading={isLoading} />

        {/* Voice input bar (fixed at bottom) */}
        <div
          className="shrink-0"
          style={{ borderTop: '1px solid var(--rune-border)' }}
        >
          <VoiceInput onSend={sendMessage} disabled={isLoading} />
        </div>
      </div>

      {/* RIGHT panel — Activity sidebar (35%) */}
      <div
        className="flex flex-col"
        style={{
          width: '35%',
          backgroundColor: 'var(--rune-surface)',
        }}
      >
        <ActivityStream
          rooms={rooms}
          backlogItems={backlogItems}
          nextItem={nextItem}
        />
      </div>
    </div>
  );
}
