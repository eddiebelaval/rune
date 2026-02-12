'use client';

import { useState } from 'react';
import type { WorkspaceRooms } from '@/hooks/useWorkspace';
import type { BacklogItem, Room } from '@/types/database';

// ---------------------------------------------------------------------------
// ActivityStream — Right sidebar with Workspace + Progress tabs
// ---------------------------------------------------------------------------

interface ActivityStreamProps {
  rooms: WorkspaceRooms;
  backlogItems: BacklogItem[];
  nextItem: BacklogItem | null;
}

type Tab = 'workspace' | 'progress';

/** Simple inline SVG chevron for expandable sections */
function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="transition-transform duration-200"
      style={{
        transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
      }}
    >
      <path
        d="M9 6l6 6-6 6"
        stroke="var(--rune-muted)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Room display label mapping */
const roomLabels: Record<Room, string> = {
  brainstorm: 'Brainstorm',
  drafts: 'Drafts',
  publish: 'Publish',
};

/** Backlog item type labels */
const itemTypeLabels: Record<string, string> = {
  question: 'Question',
  contradiction: 'Contradiction',
  thin_spot: 'Thin Spot',
  unexplored: 'Unexplored',
  review: 'Review',
  idea: 'Idea',
};

function WorkspaceTab({ rooms }: { rooms: WorkspaceRooms }) {
  const [expandedRooms, setExpandedRooms] = useState<Record<string, boolean>>({
    brainstorm: true,
    drafts: false,
    publish: false,
  });

  const toggleRoom = (room: string) => {
    setExpandedRooms((prev) => ({ ...prev, [room]: !prev[room] }));
  };

  const roomKeys = Object.keys(rooms) as Room[];

  return (
    <div className="space-y-1">
      {roomKeys.map((roomKey) => {
        const categories = rooms[roomKey];
        const categoryKeys = Object.keys(categories);
        const totalFiles = categoryKeys.reduce(
          (sum, cat) => sum + categories[cat].length,
          0,
        );
        const isExpanded = expandedRooms[roomKey] ?? false;

        return (
          <div key={roomKey}>
            {/* Room header */}
            <button
              type="button"
              onClick={() => toggleRoom(roomKey)}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-md transition-colors duration-150 cursor-pointer"
              style={{
                backgroundColor: isExpanded ? 'var(--rune-elevated)' : 'transparent',
              }}
            >
              <ChevronIcon expanded={isExpanded} />
              <span
                className="text-xs font-medium uppercase tracking-wider"
                style={{
                  color: 'var(--rune-heading)',
                  fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
                }}
              >
                {roomLabels[roomKey]}
              </span>
              <span
                className="ml-auto text-xs"
                style={{ color: 'var(--rune-muted)' }}
              >
                {totalFiles}
              </span>
            </button>

            {/* Categories */}
            {isExpanded && categoryKeys.length > 0 && (
              <div className="ml-5 pl-3 space-y-0.5" style={{ borderLeft: '1px solid var(--rune-border)' }}>
                {categoryKeys.map((cat) => (
                  <div
                    key={cat}
                    className="flex items-center justify-between px-2 py-1"
                  >
                    <span
                      className="text-xs"
                      style={{
                        color: 'var(--rune-text)',
                        fontFamily: 'var(--font-body, "Source Sans 3", sans-serif)',
                      }}
                    >
                      {cat}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: 'var(--rune-muted)' }}
                    >
                      {categories[cat].length}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Empty room */}
            {isExpanded && categoryKeys.length === 0 && (
              <div className="ml-5 pl-3 py-2">
                <span
                  className="text-xs italic"
                  style={{ color: 'var(--rune-muted)' }}
                >
                  Empty
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ProgressTab({
  rooms,
  backlogItems,
  nextItem,
}: {
  rooms: WorkspaceRooms;
  backlogItems: BacklogItem[];
  nextItem: BacklogItem | null;
}) {
  // Compute stats
  const totalFiles = Object.values(rooms).reduce(
    (sum, categories) =>
      sum + Object.values(categories).reduce((s, files) => s + files.length, 0),
    0,
  );

  return (
    <div className="space-y-4">
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 px-3">
        <StatCard label="Files" value={totalFiles} />
        <StatCard label="Backlog" value={backlogItems.length} />
      </div>

      {/* Next backlog item */}
      {nextItem && (
        <div className="px-3">
          <p
            className="text-xs uppercase tracking-wider mb-2"
            style={{
              color: 'var(--rune-muted)',
              fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
            }}
          >
            Next Up
          </p>
          <div
            className="rounded-lg p-3"
            style={{
              backgroundColor: 'var(--rune-elevated)',
              border: '1px solid var(--rune-border)',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: 'var(--rune-teal)' }}
              />
              <span
                className="text-xs uppercase tracking-wider"
                style={{
                  color: 'var(--rune-teal)',
                  fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
                }}
              >
                {itemTypeLabels[nextItem.item_type] ?? nextItem.item_type}
              </span>
              <span
                className="ml-auto text-xs"
                style={{ color: 'var(--rune-muted)' }}
              >
                P{nextItem.priority}
              </span>
            </div>
            <p
              className="text-sm leading-snug"
              style={{
                color: 'var(--rune-text)',
                fontFamily: 'var(--font-body, "Source Sans 3", sans-serif)',
              }}
            >
              {nextItem.content}
            </p>
          </div>
        </div>
      )}

      {/* No backlog items */}
      {backlogItems.length === 0 && (
        <div className="px-3">
          <p
            className="text-xs italic"
            style={{ color: 'var(--rune-muted)' }}
          >
            No backlog items yet. They will appear as you write.
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="rounded-lg p-3 text-center"
      style={{
        backgroundColor: 'var(--rune-elevated)',
        border: '1px solid var(--rune-border)',
      }}
    >
      <p
        className="text-lg font-medium"
        style={{
          color: 'var(--rune-heading)',
          fontFamily: 'var(--font-heading, "Source Serif 4", serif)',
        }}
      >
        {value}
      </p>
      <p
        className="text-xs uppercase tracking-wider"
        style={{
          color: 'var(--rune-muted)',
          fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
        }}
      >
        {label}
      </p>
    </div>
  );
}

export default function ActivityStream({ rooms, backlogItems, nextItem }: ActivityStreamProps) {
  const [activeTab, setActiveTab] = useState<Tab>('workspace');

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div
        className="flex px-3 pt-3 pb-1 gap-1"
        style={{ borderBottom: '1px solid var(--rune-border)' }}
      >
        {(['workspace', 'progress'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className="flex-1 text-center py-2 rounded-md text-xs uppercase tracking-wider transition-colors duration-150 cursor-pointer"
            style={{
              fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
              backgroundColor: activeTab === tab ? 'var(--rune-elevated)' : 'transparent',
              color: activeTab === tab ? 'var(--rune-heading)' : 'var(--rune-muted)',
            }}
          >
            {tab === 'workspace' ? 'Workspace' : 'Progress'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto py-3">
        {activeTab === 'workspace' ? (
          <WorkspaceTab rooms={rooms} />
        ) : (
          <ProgressTab rooms={rooms} backlogItems={backlogItems} nextItem={nextItem} />
        )}
      </div>
    </div>
  );
}
