/**
 * Workspace file CRUD API route.
 *
 * GET    /api/workspace?book_id=...&room=...&category=...
 * POST   /api/workspace  { book_id, room, category, title, content? }
 * PATCH  /api/workspace  { id, title?, content?, room?, category? }
 * DELETE /api/workspace  { id }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import {
  getWorkspaceFiles,
  createWorkspaceFile,
  updateWorkspaceFile,
  deleteWorkspaceFile,
} from '@/lib/workspace';
import type { Room } from '@/types/database';

const VALID_ROOMS: Room[] = ['brainstorm', 'drafts', 'publish'];

export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get('book_id');

  if (!bookId) {
    return NextResponse.json({ error: 'book_id is required' }, { status: 400 });
  }

  // Verify book ownership
  const { data: book } = await supabase
    .from('books')
    .select('id')
    .eq('id', bookId)
    .eq('user_id', user.id)
    .single();

  if (!book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 });
  }

  const room = searchParams.get('room') as Room | null;
  const category = searchParams.get('category') ?? undefined;

  try {
    const files = await getWorkspaceFiles(bookId, room ?? undefined, category);
    return NextResponse.json(files);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { book_id?: string; room?: string; category?: string; title?: string; content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.book_id) return NextResponse.json({ error: 'book_id is required' }, { status: 400 });
  if (!body.room || !VALID_ROOMS.includes(body.room as Room)) {
    return NextResponse.json({ error: `room must be one of: ${VALID_ROOMS.join(', ')}` }, { status: 400 });
  }
  if (!body.category) return NextResponse.json({ error: 'category is required' }, { status: 400 });
  if (!body.title) return NextResponse.json({ error: 'title is required' }, { status: 400 });

  // Verify book ownership
  const { data: book } = await supabase
    .from('books')
    .select('id')
    .eq('id', body.book_id)
    .eq('user_id', user.id)
    .single();

  if (!book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 });
  }

  try {
    const file = await createWorkspaceFile(
      body.book_id,
      body.room as Room,
      body.category,
      body.title,
      body.content,
    );
    return NextResponse.json(file, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { id?: string; title?: string; content?: string; room?: string; category?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  // Verify file belongs to a book owned by this user
  const { data: file } = await supabase
    .from('workspace_files')
    .select('book_id')
    .eq('id', body.id)
    .single();

  if (!file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const { data: book } = await supabase
    .from('books')
    .select('id')
    .eq('id', file.book_id)
    .eq('user_id', user.id)
    .single();

  if (!book) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const updates: Record<string, string> = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.content !== undefined) updates.content = body.content;
  if (body.room !== undefined) updates.room = body.room;
  if (body.category !== undefined) updates.category = body.category;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  try {
    const updated = await updateWorkspaceFile(body.id, updates);
    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  // Verify file belongs to a book owned by this user
  const { data: file } = await supabase
    .from('workspace_files')
    .select('book_id')
    .eq('id', body.id)
    .single();

  if (!file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const { data: book } = await supabase
    .from('books')
    .select('id')
    .eq('id', file.book_id)
    .eq('user_id', user.id)
    .single();

  if (!book) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  try {
    await deleteWorkspaceFile(body.id);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
