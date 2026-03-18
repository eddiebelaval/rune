'use client';

import { useSession } from '@/hooks/useSession';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useBacklog } from '@/hooks/useBacklog';
import type { BookType, QualityLevel } from '@/types/database';
import MessageArea from '@/components/MessageArea';
import VoiceInput from '@/components/VoiceInput';
import ActivityStream from '@/components/ActivityStream';
import SamPresenceRing from '@/components/SamPresenceRing';
import SamChatPeek from '@/components/SamChatPeek';

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
      className="flex h-full"
      style={{ backgroundColor: 'var(--rune-bg)' }}
    >
      <SamPresenceRing active={isLoading} />
      <SamChatPeek
        messages={messages
          .filter((m) => m.role === 'assistant')
          .map((m) => ({ id: m.id, content: m.content, timestamp: m.timestamp }))}
      />
      {/* LEFT panel — Conversation (65%) */}
      <div
        className="flex flex-col"
        style={{
          width: '65%',
          borderRight: '1px solid var(--rune-border)',
        }}
      >
        {/* Message area (fills remaining space) */}
        <MessageArea messages={messages} isLoading={isLoading} bookId={bookId} bookTitle={title} onSend={sendMessage} />

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
          bookId={bookId}
          rooms={rooms}
          backlogItems={backlogItems}
          nextItem={nextItem}
        />
      </div>
    </div>
  );
}
