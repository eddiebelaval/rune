import { createServerClient } from '@/lib/supabase';
import type { BookType, Room, WorkspaceFile } from '@/types/database';

// ---------------------------------------------------------------------------
// Workspace Templates — default folder structure per book type
// ---------------------------------------------------------------------------

const WORKSPACE_TEMPLATES: Record<BookType, Record<Room, string[]>> = {
  memoir: {
    brainstorm: ['people', 'eras', 'places', 'emotions', 'artifacts', 'themes', 'raw-sessions'],
    drafts: ['outline', 'chapters', 'fragments', 'timeline', 'revision-notes'],
    publish: ['manuscript', 'synopsis', 'exports', 'targets'],
  },
  fiction: {
    brainstorm: ['characters', 'world-bible', 'plot-threads', 'magic-systems', 'themes', 'raw-sessions'],
    drafts: ['outline', 'story-arc', 'chapters', 'scenes', 'revision-notes'],
    publish: ['manuscript', 'synopsis', 'exports', 'targets'],
  },
  nonfiction: {
    brainstorm: ['concepts', 'frameworks', 'case-studies', 'arguments', 'research', 'raw-sessions'],
    drafts: ['outline', 'thesis', 'chapters', 'sections', 'revision-notes'],
    publish: ['manuscript', 'synopsis', 'exports', 'targets'],
  },
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type WorkspaceFileInsert = Omit<WorkspaceFile, 'id' | 'created_at' | 'updated_at'>;
type WorkspaceFileUpdate = Partial<Pick<WorkspaceFile, 'title' | 'content' | 'room' | 'category' | 'position'>>;

export interface WorkspaceStructure {
  bookId: string;
  rooms: Record<Room, Record<string, WorkspaceFile[]>>;
}

// ---------------------------------------------------------------------------
// CRUD Operations
// ---------------------------------------------------------------------------

/**
 * Create a new workspace file inside a room/category.
 */
export async function createWorkspaceFile(
  bookId: string,
  room: Room,
  category: string,
  title: string,
  content?: string,
): Promise<WorkspaceFile> {
  const supabase = await createServerClient();

  // Determine next position within this room + category
  const { count } = await supabase
    .from('workspace_files')
    .select('*', { count: 'exact', head: true })
    .eq('book_id', bookId)
    .eq('room', room)
    .eq('category', category);

  const position = (count ?? 0) + 1;

  const row: WorkspaceFileInsert = {
    book_id: bookId,
    room,
    category,
    title,
    content: content ?? '',
    source_session_id: null,
    position,
  };

  const { data, error } = await supabase
    .from('workspace_files')
    .insert(row)
    .select()
    .single();

  if (error) throw new Error(`Failed to create workspace file: ${error.message}`);
  return data as WorkspaceFile;
}

/**
 * Retrieve workspace files, optionally filtered by room and/or category.
 */
export async function getWorkspaceFiles(
  bookId: string,
  room?: Room,
  category?: string,
): Promise<WorkspaceFile[]> {
  const supabase = await createServerClient();

  let query = supabase
    .from('workspace_files')
    .select('*')
    .eq('book_id', bookId)
    .order('position', { ascending: true });

  if (room) {
    query = query.eq('room', room);
  }
  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch workspace files: ${error.message}`);
  return (data ?? []) as WorkspaceFile[];
}

/**
 * Update a workspace file by id.
 */
export async function updateWorkspaceFile(
  id: string,
  updates: WorkspaceFileUpdate,
): Promise<WorkspaceFile> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('workspace_files')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update workspace file: ${error.message}`);
  return data as WorkspaceFile;
}

/**
 * Delete a workspace file by id.
 */
export async function deleteWorkspaceFile(id: string): Promise<void> {
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('workspace_files')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Failed to delete workspace file: ${error.message}`);
}

/**
 * Return the full workspace structure for a book organized as a tree:
 * rooms -> categories -> files[]
 */
export async function getWorkspaceStructure(bookId: string): Promise<WorkspaceStructure> {
  const files = await getWorkspaceFiles(bookId);

  const rooms: WorkspaceStructure['rooms'] = {
    brainstorm: {},
    drafts: {},
    publish: {},
  };

  for (const file of files) {
    const room = rooms[file.room];
    if (!room[file.category]) {
      room[file.category] = [];
    }
    room[file.category].push(file);
  }

  return { bookId, rooms };
}

/**
 * Initialize the default workspace folder structure for a new book.
 * Creates one placeholder file per category so the structure is visible
 * in the UI from the start.
 */
export async function initializeWorkspace(
  bookId: string,
  bookType: BookType,
): Promise<void> {
  const template = WORKSPACE_TEMPLATES[bookType];
  const supabase = await createServerClient();

  const rows: WorkspaceFileInsert[] = [];

  for (const room of Object.keys(template) as Room[]) {
    const categories = template[room];
    for (let i = 0; i < categories.length; i++) {
      rows.push({
        book_id: bookId,
        room,
        category: categories[i],
        title: `${categories[i]} (start here)`,
        content: '',
        source_session_id: null,
        position: i + 1,
      });
    }
  }

  const { error } = await supabase.from('workspace_files').insert(rows);
  if (error) throw new Error(`Failed to initialize workspace: ${error.message}`);
}
