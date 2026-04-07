/**
 * Backlog item interaction API route.
 *
 * PATCH /api/backlog  { id, action: 'address' | 'dismiss' }
 */

import { NextRequest, NextResponse } from 'next/server';
import { addressItem, dismissItem } from '@/lib/backlog';
import {
  jsonBadRequest,
  jsonForbidden,
  jsonInternalError,
  jsonNotFound,
  parseJsonBody,
  requireAuthenticatedRouteContext,
} from '@/lib/api/route';

export async function PATCH(request: NextRequest) {
  const context = await requireAuthenticatedRouteContext();
  if (context instanceof NextResponse) {
    return context;
  }

  const { supabase, user } = context;
  const parsed = await parseJsonBody<{ id?: string; action?: string }>(request);
  if (!parsed.ok) {
    return parsed.response;
  }

  const body = parsed.data;

  if (!body.id || typeof body.id !== 'string') {
    return jsonBadRequest('id is required');
  }

  if (!body.action || !['address', 'dismiss'].includes(body.action)) {
    return jsonBadRequest('action must be "address" or "dismiss"');
  }

  const { data: item } = await supabase
    .from('backlog_items')
    .select('book_id')
    .eq('id', body.id)
    .single();

  if (!item) {
    return jsonNotFound('Backlog item not found');
  }

  const { data: book } = await supabase
    .from('books')
    .select('id')
    .eq('id', item.book_id)
    .eq('user_id', user.id)
    .single();

  if (!book) {
    return jsonForbidden('Not authorized');
  }

  try {
    const updated =
      body.action === 'address'
        ? await addressItem(body.id)
        : await dismissItem(body.id);
    return NextResponse.json(updated);
  } catch (error) {
    return jsonInternalError('backlog', error);
  }
}
