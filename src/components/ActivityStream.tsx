'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { WorkspaceRooms } from '@/hooks/useWorkspace';
import type { BacklogItem, BookType, Room, WorkspaceFile } from '@/types/database';
import type { KBFileVersion, KnowledgeFile } from '@/types/knowledge';
import KnowledgeGraph from '@/components/KnowledgeGraph';
import ManuscriptViewer from '@/components/ManuscriptViewer';
import BookProgress from '@/components/BookProgress';
import WorldBuildingDashboard from '@/components/WorldBuildingDashboard';
import KBOperationCard from '@/components/KBOperationCard';
import { createClient } from '@/lib/supabase-browser';
import type { SessionKBOperation } from '@/hooks/useSession';
import { InterviewEngine } from '@/lib/interviews/engine';

// ---------------------------------------------------------------------------
// ActivityStream — Right sidebar with Workspace + Progress + Graph + Manuscript
// ---------------------------------------------------------------------------

interface ActivityStreamProps {
  bookId: string;
  bookType: BookType;
  rooms: WorkspaceRooms;
  backlogItems: BacklogItem[];
  nextItem: BacklogItem | null;
  kbOperations: SessionKBOperation[];
  onQuickPrompt: (message: string) => Promise<void>;
}

type Tab = 'world' | 'workspace' | 'progress' | 'graph' | 'manuscript';

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

/** Upload icon (arrow up into tray) */
function UploadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Download icon (arrow down from tray) */
function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="7 10 12 15 17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type ImportStatus = 'idle' | 'uploading' | 'success' | 'error';

function WorkspaceTab({ rooms, bookId }: { rooms: WorkspaceRooms; bookId: string }) {
  const [expandedRooms, setExpandedRooms] = useState<Record<string, boolean>>({
    brainstorm: true,
    drafts: false,
    publish: false,
  });
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [selectedFile, setSelectedFile] = useState<WorkspaceFile | null>(null);
  const [importStatus, setImportStatus] = useState<ImportStatus>('idle');
  const [importMessage, setImportMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleRoom = (room: string) => {
    setExpandedRooms((prev) => ({ ...prev, [room]: !prev[room] }));
  };

  const toggleCategory = (key: string) => {
    setExpandedCategories((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFileClick = useCallback((file: WorkspaceFile) => {
    setSelectedFile((prev) => (prev?.id === file.id ? null : file));
  }, []);

  const handleImport = useCallback(async (file: File) => {
    setImportStatus('uploading');
    setImportMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('book_id', bookId);

      const res = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setImportStatus('error');
        setImportMessage(data.error ?? 'Import failed');
        return;
      }

      const result = data.import;
      setImportStatus('success');
      setImportMessage(
        `${result.wordCount.toLocaleString()} words, ${result.totalSections} section${result.totalSections !== 1 ? 's' : ''}`
      );

      // Clear success message after 4s
      setTimeout(() => {
        setImportStatus('idle');
        setImportMessage('');
      }, 4000);
    } catch {
      setImportStatus('error');
      setImportMessage('Upload failed');
    }
  }, [bookId]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImport(file);
    // Reset input so the same file can be re-selected
    e.target.value = '';
  }, [handleImport]);

  const handleExport = useCallback(() => {
    window.open(`/api/export?book_id=${bookId}&format=full`, '_blank');
  }, [bookId]);

  const roomKeys = Object.keys(rooms) as Room[];

  return (
    <div className="space-y-1">
      {/* Import/Export toolbar */}
      <div className="flex items-center justify-between px-3 pb-2" style={{ borderBottom: '1px solid var(--rune-border)' }}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={importStatus === 'uploading'}
            className="flex items-center gap-1.5 px-2 py-1 rounded transition-colors duration-150 cursor-pointer"
            style={{
              color: importStatus === 'uploading' ? 'var(--rune-muted)' : 'var(--rune-gold)',
              backgroundColor: 'color-mix(in srgb, var(--rune-gold) 8%, transparent)',
              fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <UploadIcon />
            {importStatus === 'uploading' ? 'Importing...' : 'Import'}
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1.5 px-2 py-1 rounded transition-colors duration-150 cursor-pointer"
            style={{
              color: 'var(--rune-muted)',
              backgroundColor: 'transparent',
              fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <DownloadIcon />
            Export
          </button>
        </div>

        {/* Status message */}
        {importMessage && (
          <span
            className="text-xs truncate max-w-[140px]"
            style={{
              color: importStatus === 'error' ? 'var(--rune-error)' : 'var(--rune-gold)',
              fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
              fontSize: '10px',
            }}
          >
            {importMessage}
          </span>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.markdown,.docx"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Import file"
      />

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
  world: 'World',
  workspace: 'Files',
  progress: 'Progress',
  graph: 'Graph',
  manuscript: 'Read',
};

export default function ActivityStream({
  bookId,
  bookType,
  rooms,
  backlogItems,
  nextItem,
  kbOperations,
  onQuickPrompt,
}: ActivityStreamProps) {
  const [activeTab, setActiveTab] = useState<Tab>('world');
  const [kbFiles, setKbFiles] = useState<KnowledgeFile[]>([]);
  const [hiddenOperationIds, setHiddenOperationIds] = useState<string[]>([]);
  const [selectedVersionFileId, setSelectedVersionFileId] = useState<string | null>(null);
  const [versionHistory, setVersionHistory] = useState<KBFileVersion[]>([]);
  const [isVersionHistoryLoading, setIsVersionHistoryLoading] = useState(false);
  const [versionHistoryNonce, setVersionHistoryNonce] = useState(0);
  const interviewEngine = new InterviewEngine(bookType, kbFiles);
  const interviewProgress = interviewEngine.getQuestionProgress();
  const answeredCount = interviewProgress.filter((item) => item.answered).length;
  const nextQuestion = interviewEngine.getNextQuestion();
  const revisitSuggestions = interviewEngine.getRevisitSuggestions();

  // Fetch KB files for WorldBuildingDashboard
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('knowledge_files')
      .select('*')
      .eq('book_id', bookId)
      .eq('deleted', false)
      .order('updated_at', { ascending: false })
      .then(({ data }) => {
        if (data) setKbFiles(data as KnowledgeFile[]);
      });

    // Realtime subscription for KB files
    const channel = supabase
      .channel(`kb-activity-${bookId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'knowledge_files', filter: `book_id=eq.${bookId}` }, () => {
        // Refetch on any change
        supabase
          .from('knowledge_files')
          .select('*')
          .eq('book_id', bookId)
          .eq('deleted', false)
          .order('updated_at', { ascending: false })
          .then(({ data }) => {
            if (data) setKbFiles(data as KnowledgeFile[]);
          });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [bookId]);

  useEffect(() => {
    if (!selectedVersionFileId) {
      setVersionHistory([]);
      return;
    }

    let cancelled = false;
    setIsVersionHistoryLoading(true);

    fetch(`/api/kb-history?fileId=${selectedVersionFileId}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Failed to load KB version history');
        }
        return response.json();
      })
      .then((payload) => {
        if (!cancelled) {
          setVersionHistory((payload.versions ?? []) as KBFileVersion[]);
        }
      })
      .catch((error) => {
        console.error('[ActivityStream] Failed to load KB version history:', error);
        if (!cancelled) {
          setVersionHistory([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsVersionHistoryLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedVersionFileId, versionHistoryNonce]);

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div
        className="flex px-3 pt-3 pb-1 gap-1"
        style={{ borderBottom: '1px solid var(--rune-border)' }}
      >
        {(['world', 'workspace', 'progress', 'graph', 'manuscript'] as const).map((tab) => (
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
        {activeTab === 'world' && (
          <div className="px-3">
            {kbOperations
              .filter((operation) => !hiddenOperationIds.includes(operation.id))
              .map((operation) => (
                <div key={operation.id} className="mb-3">
                  <KBOperationCard
                    operationType={operation.operationType}
                    fileType={operation.fileType}
                    title={operation.title}
                    contentPreview={operation.contentPreview}
                    onApprove={() =>
                      setHiddenOperationIds((prev) =>
                        prev.includes(operation.id) ? prev : [...prev, operation.id],
                      )
                    }
                    onDismiss={() =>
                      setHiddenOperationIds((prev) =>
                        prev.includes(operation.id) ? prev : [...prev, operation.id],
                      )
                    }
                  />
                </div>
              ))}
            <div
              className="mb-3 rounded-lg border p-4"
              style={{
                background: 'var(--rune-surface)',
                borderColor: 'var(--rune-border)',
              }}
            >
              <div
                className="mb-2 text-xs font-mono uppercase tracking-wider"
                style={{ color: 'var(--rune-teal)' }}
              >
                Interview Progress
              </div>
              <div
                className="mb-1 text-sm font-semibold"
                style={{ color: 'var(--rune-heading)', fontFamily: 'var(--font-serif)' }}
              >
                {answeredCount} of {interviewProgress.length} guided topics covered
              </div>
              <div className="mb-3 text-xs" style={{ color: 'var(--rune-muted)' }}>
                {nextQuestion
                  ? `Next likely thread: ${nextQuestion.targetTitle}`
                  : 'Core interview topics are covered. This is a good moment to deepen weak spots.'}
              </div>

              {nextQuestion && (
                <button
                  type="button"
                  onClick={() => void onQuickPrompt(nextQuestion.question)}
                  className="mb-3 w-full rounded-lg px-3 py-2 text-left text-xs"
                  style={{
                    background: 'color-mix(in srgb, var(--rune-teal) 10%, transparent)',
                    color: 'var(--rune-heading)',
                    border: '1px solid var(--rune-border)',
                  }}
                >
                  Ask Next Question
                  <div style={{ color: 'var(--rune-muted)' }}>{nextQuestion.question}</div>
                </button>
              )}

              {revisitSuggestions.length > 0 && (
                <div className="space-y-2">
                  {revisitSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => void onQuickPrompt(suggestion)}
                      className="w-full rounded-lg px-3 py-2 text-left text-xs"
                      style={{
                        background: 'var(--rune-bg)',
                        color: 'var(--rune-text)',
                        border: '1px solid var(--rune-border)',
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <WorldBuildingDashboard
              kbFiles={kbFiles}
              gateScore={(() => {
                const types = ['characters', 'world-building', 'lore', 'relationships-map', 'timeline'];
                const populated = types.filter(t => kbFiles.some(f => f.file_type === t && f.content.length > 30));
                return Math.round((populated.length / types.length) * 100);
              })()}
              gateReady={
                kbFiles.some(f => f.file_type === 'characters' && f.content.length > 30) &&
                kbFiles.some(f => f.file_type === 'world-building' && f.content.length > 30)
              }
              blockers={[
                ...(!kbFiles.some(f => f.file_type === 'characters' && f.content.length > 30) ? ['No characters described yet'] : []),
                ...(!kbFiles.some(f => f.file_type === 'world-building' && f.content.length > 30) ? ['No world description yet'] : []),
              ]}
              suggestions={[
                ...(!kbFiles.some(f => f.file_type === 'lore') ? ['Consider defining the rules of your world'] : []),
                ...(!kbFiles.some(f => f.file_type === 'relationships-map') ? ['Map character relationships for better dialogue'] : []),
                ...(!kbFiles.some(f => f.file_type === 'timeline') ? ['A timeline helps maintain consistency'] : []),
              ]}
            />

            <div
              className="mt-3 rounded-lg border p-4"
              style={{
                background: 'var(--rune-surface)',
                borderColor: 'var(--rune-border)',
              }}
            >
              <div
                className="mb-2 text-xs font-mono uppercase tracking-wider"
                style={{ color: 'var(--rune-gold)' }}
              >
                KB Versions
              </div>
              <div className="mb-3 space-y-2">
                {kbFiles.slice(0, 5).map((file) => (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() => setSelectedVersionFileId(file.id)}
                    className="w-full rounded-lg border px-3 py-2 text-left text-xs"
                    style={{
                      background:
                        selectedVersionFileId === file.id ? 'var(--rune-elevated)' : 'var(--rune-bg)',
                      borderColor: 'var(--rune-border)',
                      color: 'var(--rune-text)',
                    }}
                  >
                    <div
                      className="font-semibold"
                      style={{ color: 'var(--rune-heading)', fontFamily: 'var(--font-serif)' }}
                    >
                      {file.title}
                    </div>
                    <div style={{ color: 'var(--rune-muted)' }}>
                      v{file.current_semantic_version}
                      {typeof file.metadata?.extraction_confidence === 'number'
                        ? ` • confidence ${Math.round(file.metadata.extraction_confidence * 100)}%`
                        : ''}
                      {(typeof file.metadata?.source_session === 'string' || typeof file.metadata?.last_interview_session === 'string')
                        ? ` • session ${String(file.metadata?.source_session ?? file.metadata?.last_interview_session)}`
                        : ''}
                      {file.source_type
                        ? ` • ${String(file.source_type)}`
                        : ''}
                    </div>
                  </button>
                ))}
              </div>

              {selectedVersionFileId && (
                <div className="space-y-2">
                  {isVersionHistoryLoading && (
                    <div className="text-xs" style={{ color: 'var(--rune-muted)' }}>
                      Loading version history...
                    </div>
                  )}
                  {!isVersionHistoryLoading && versionHistory.length === 0 && (
                    <div className="text-xs" style={{ color: 'var(--rune-muted)' }}>
                      No version snapshots found for this file yet.
                    </div>
                  )}
                  {versionHistory.map((version) => (
                    <div
                      key={version.id}
                      className="rounded-lg border px-3 py-2"
                      style={{
                        background: 'var(--rune-bg)',
                        borderColor: 'var(--rune-border)',
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div
                            className="text-xs font-semibold"
                            style={{ color: 'var(--rune-heading)' }}
                          >
                            v{version.semantic_version}
                          </div>
                          <div className="text-[11px]" style={{ color: 'var(--rune-muted)' }}>
                            {version.version_metadata?.change_summary
                              ? String(version.version_metadata.change_summary)
                              : 'Snapshot available'}
                            {typeof version.version_metadata?.confidence === 'number'
                              ? ` • ${Math.round(version.version_metadata.confidence * 100)}% confidence`
                              : ''}
                            {typeof version.version_metadata?.restored_from_version === 'number'
                              ? ` • restored from v${version.version_metadata.restored_from_version}`
                              : ''}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            await fetch('/api/kb-history', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                fileId: selectedVersionFileId,
                                version: version.version,
                              }),
                            });
                            setVersionHistoryNonce((prev) => prev + 1);
                          }}
                          className="rounded px-2 py-1 text-[11px]"
                          style={{
                            background: 'color-mix(in srgb, var(--rune-gold) 14%, transparent)',
                            color: 'var(--rune-gold)',
                            border: 'none',
                          }}
                        >
                          Restore
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === 'workspace' && <WorkspaceTab rooms={rooms} bookId={bookId} />}
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
