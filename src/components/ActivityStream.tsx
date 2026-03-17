'use client';

import { useState, useCallback } from 'react';
import type { WorkspaceRooms } from '@/hooks/useWorkspace';
import type { BacklogItem, Room, WorkspaceFile } from '@/types/database';
import KnowledgeGraph from '@/components/KnowledgeGraph';
import ManuscriptViewer from '@/components/ManuscriptViewer';
import BookProgress from '@/components/BookProgress';

// ---------------------------------------------------------------------------
// ActivityStream — Right sidebar with Workspace + Progress + Graph + Manuscript
// ---------------------------------------------------------------------------

interface ActivityStreamProps {
  bookId: string;
  rooms: WorkspaceRooms;
  backlogItems: BacklogItem[];
  nextItem: BacklogItem | null;
}

type Tab = 'workspace' | 'progress' | 'graph' | 'manuscript';

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

function WorkspaceTab({ rooms }: { rooms: WorkspaceRooms }) {
  const [expandedRooms, setExpandedRooms] = useState<Record<string, boolean>>({
    brainstorm: true,
    drafts: false,
    publish: false,
  });
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [selectedFile, setSelectedFile] = useState<WorkspaceFile | null>(null);

  const toggleRoom = (room: string) => {
    setExpandedRooms((prev) => ({ ...prev, [room]: !prev[room] }));
  };

  const toggleCategory = (key: string) => {
    setExpandedCategories((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFileClick = useCallback((file: WorkspaceFile) => {
    setSelectedFile((prev) => (prev?.id === file.id ? null : file));
  }, []);

  const roomKeys = Object.keys(rooms) as Room[];

  return (
    <div className="space-y-1">
      {/* File viewer panel */}
      {selectedFile && (
        <div
          className="mx-3 mb-2 rounded-lg p-3"
          style={{
            backgroundColor: 'var(--rune-elevated)',
            border: '1px solid var(--rune-border)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-xs font-medium"
              style={{
                color: 'var(--rune-heading)',
                fontFamily: 'var(--font-heading, "Source Serif 4", serif)',
              }}
            >
              {selectedFile.title}
            </span>
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              className="text-xs cursor-pointer"
              style={{ color: 'var(--rune-muted)' }}
            >
              Close
            </button>
          </div>
          <div
            className="text-xs leading-relaxed whitespace-pre-wrap"
            style={{
              color: 'var(--rune-text)',
              fontFamily: 'var(--font-body, "Source Sans 3", sans-serif)',
              maxHeight: '200px',
              overflowY: 'auto',
            }}
          >
            {selectedFile.content || (
              <span className="italic" style={{ color: 'var(--rune-muted)' }}>
                Empty file
              </span>
            )}
          </div>
        </div>
      )}

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

            {/* Categories with files */}
            {isExpanded && categoryKeys.length > 0 && (
              <div className="ml-5 pl-3 space-y-0.5" style={{ borderLeft: '1px solid var(--rune-border)' }}>
                {categoryKeys.map((cat) => {
                  const catKey = `${roomKey}-${cat}`;
                  const catFiles = categories[cat];
                  const isCatExpanded = expandedCategories[catKey] ?? false;

                  return (
                    <div key={cat}>
                      <button
                        type="button"
                        onClick={() => toggleCategory(catKey)}
                        className="flex items-center justify-between w-full px-2 py-1 rounded cursor-pointer transition-colors duration-100"
                        style={{
                          backgroundColor: isCatExpanded ? 'color-mix(in srgb, var(--rune-elevated) 50%, transparent)' : 'transparent',
                        }}
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
                          {catFiles.length}
                        </span>
                      </button>

                      {/* File list within category */}
                      {isCatExpanded && catFiles.length > 0 && (
                        <div className="ml-3 space-y-px">
                          {catFiles.map((file) => (
                            <button
                              key={file.id}
                              type="button"
                              onClick={() => handleFileClick(file)}
                              className="w-full text-left px-2 py-1 rounded text-xs truncate cursor-pointer transition-colors duration-100"
                              style={{
                                color: selectedFile?.id === file.id ? 'var(--rune-gold)' : 'var(--rune-muted)',
                                backgroundColor: selectedFile?.id === file.id ? 'color-mix(in srgb, var(--rune-gold) 8%, transparent)' : 'transparent',
                                fontFamily: 'var(--font-body, "Source Sans 3", sans-serif)',
                              }}
                            >
                              {file.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
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

const TAB_LABELS: Record<Tab, string> = {
  workspace: 'Files',
  progress: 'Progress',
  graph: 'Graph',
  manuscript: 'Read',
};

export default function ActivityStream({ bookId, rooms, backlogItems, nextItem }: ActivityStreamProps) {
  const [activeTab, setActiveTab] = useState<Tab>('workspace');

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div
        className="flex px-3 pt-3 pb-1 gap-1"
        style={{ borderBottom: '1px solid var(--rune-border)' }}
      >
        {(['workspace', 'progress', 'graph', 'manuscript'] as const).map((tab) => (
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
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto py-3">
        {activeTab === 'workspace' && <WorkspaceTab rooms={rooms} />}
        {activeTab === 'progress' && <BookProgress bookId={bookId} />}
        {activeTab === 'graph' && (
          <div className="px-3">
            <KnowledgeGraph bookId={bookId} />
          </div>
        )}
        {activeTab === 'manuscript' && <ManuscriptViewer bookId={bookId} />}
      </div>
    </div>
  );
}
