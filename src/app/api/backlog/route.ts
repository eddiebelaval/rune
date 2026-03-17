/**
 * Backlog item interaction API route.
 *
 * PATCH /api/backlog  { id, action: 'address' | 'dismiss' }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { addressItem, dismissItem } from '@/lib/backlog';

export async function PATCH(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { id?: string; action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.id || typeof body.id !== 'string') {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  if (!body.action || !['address', 'dismiss'].includes(body.action)) {
    return NextResponse.json(
      { error: 'action must be "address" or "dismiss"' },
      { status: 400 },
    );
  }

  // Verify the backlog item belongs to a book owned by this user
  const { data: item } = await supabase
    .from('backlog_items')
    .select('book_id')
    .eq('id', body.id)
    .single();

  if (!item) {
    return NextResponse.json({ error: 'Backlog item not found' }, { status: 404 });
  }

  const { data: book } = await supabase
    .from('books')
    .select('id')
    .eq('id', item.book_id)
    .eq('user_id', user.id)
    .single();

  if (!book) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  try {
    const updated = body.action === 'address'
      ? await addressItem(body.id)
      : await dismissItem(body.id);
    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
