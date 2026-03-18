import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import type { Profile, ThemeMode } from '@/types/database';

const VALID_THEMES: ThemeMode[] = ['light', 'dark', 'system'];

/**
 * GET /api/profile — Fetch the authenticated user's profile.
 * Auto-creates a profile if one doesn't exist (handles pre-trigger users).
 */
export async function GET() {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error && error.code === 'PGRST116') {
    // Profile doesn't exist — create one (pre-trigger user)
    const displayName = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? null;
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        display_name: displayName,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    profile = newProfile;
  } else if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    profile: profile as Profile,
    email: user.email,
  });
}

/**
 * PATCH /api/profile — Update display_name, theme, preferences.
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.display_name !== undefined) {
    if (typeof body.display_name !== 'string' || body.display_name.length > 100) {
      return NextResponse.json({ error: 'Invalid display_name' }, { status: 400 });
    }
    updates.display_name = body.display_name.trim() || null;
  }

  if (body.theme !== undefined) {
    if (!VALID_THEMES.includes(body.theme)) {
      return NextResponse.json({ error: 'Invalid theme' }, { status: 400 });
    }
    updates.theme = body.theme;
  }

  if (body.preferences !== undefined) {
    if (typeof body.preferences !== 'object' || body.preferences === null) {
      return NextResponse.json({ error: 'Invalid preferences' }, { status: 400 });
    }
    // Merge with existing preferences
    const { data: existing } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('id', user.id)
      .single();

    updates.preferences = {
      ...(existing?.preferences ?? {}),
      ...body.preferences,
    };
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: profile as Profile });
}

/**
 * DELETE /api/profile — Delete user account and all associated data.
 * This is a destructive, irreversible operation.
 */
export async function DELETE() {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Delete all user's books (cascades to sessions, workspace_files, etc.)
  const { error: booksError } = await supabase
    .from('books')
    .delete()
    .eq('user_id', user.id);

  if (booksError) {
    return NextResponse.json({ error: 'Failed to delete books: ' + booksError.message }, { status: 500 });
  }

  // Profile will cascade-delete when auth user is deleted
  // Sign out the user (client-side will handle redirect)
  await supabase.auth.signOut();

  return NextResponse.json({ success: true });
}
