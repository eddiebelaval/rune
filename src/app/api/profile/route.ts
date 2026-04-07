import { NextRequest, NextResponse } from 'next/server'
import {
  jsonBadRequest,
  jsonInternalError,
  jsonTooManyRequests,
  parseJsonBody,
  requireAuthenticatedRouteContext,
} from '@/lib/api/route'
import {
  buildRateLimitKey,
  enforceRateLimit,
  RATE_LIMITS,
} from '@/lib/rate-limit'
import type { Profile, ThemeMode } from '@/types/database'

const VALID_THEMES: ThemeMode[] = ['light', 'dark', 'system']

export async function GET() {
  try {
    const context = await requireAuthenticatedRouteContext()
    if (context instanceof NextResponse) {
      return context
    }

    const { supabase, user } = context
    let { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error && error.code === 'PGRST116') {
      const displayName = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? null
      const created = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          display_name: displayName,
        })
        .select()
        .single()

      if (created.error) {
        throw new Error(created.error.message)
      }

      profile = created.data
    } else if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({
      profile: profile as Profile,
      email: user.email,
    })
  } catch (error) {
    return jsonInternalError('profile:get', error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const context = await requireAuthenticatedRouteContext()
    if (context instanceof NextResponse) {
      return context
    }

    const { supabase, user } = context
    const limit = enforceRateLimit(
      buildRateLimitKey(request, 'profile:update', user.id),
      RATE_LIMITS.profileMutation
    )

    if (!limit.allowed) {
      return jsonTooManyRequests({
        ...limit,
        error: 'Too many profile changes. Please wait a moment before trying again.',
      })
    }

    const parsed = await parseJsonBody<{
      display_name?: unknown
      theme?: unknown
      preferences?: unknown
    }>(request)
    if (!parsed.ok) {
      return parsed.response
    }

    const body = parsed.data
    const updates: Record<string, unknown> = {}

    if (body.display_name !== undefined) {
      if (typeof body.display_name !== 'string' || body.display_name.length > 100) {
        return jsonBadRequest('Invalid display_name')
      }
      updates.display_name = body.display_name.trim() || null
    }

    if (body.theme !== undefined) {
      if (!VALID_THEMES.includes(body.theme as ThemeMode)) {
        return jsonBadRequest('Invalid theme')
      }
      updates.theme = body.theme
    }

    if (body.preferences !== undefined) {
      if (typeof body.preferences !== 'object' || body.preferences === null) {
        return jsonBadRequest('Invalid preferences')
      }

      const { data: existing, error: existingError } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', user.id)
        .single()

      if (existingError && existingError.code !== 'PGRST116') {
        throw new Error(existingError.message)
      }

      updates.preferences = {
        ...(existing?.preferences ?? {}),
        ...(body.preferences as Record<string, unknown>),
      }
    }

    if (Object.keys(updates).length === 0) {
      return jsonBadRequest('No valid fields to update')
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({ profile: profile as Profile })
  } catch (error) {
    return jsonInternalError('profile:update', error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const context = await requireAuthenticatedRouteContext()
    if (context instanceof NextResponse) {
      return context
    }

    const { supabase, user } = context
    const limit = enforceRateLimit(
      buildRateLimitKey(request, 'profile:delete', user.id),
      RATE_LIMITS.profileMutation
    )

    if (!limit.allowed) {
      return jsonTooManyRequests({
        ...limit,
        error: 'Too many account actions. Please wait a moment before trying again.',
      })
    }

    const { error: booksError } = await supabase
      .from('books')
      .delete()
      .eq('user_id', user.id)

    if (booksError) {
      throw new Error(`Failed to delete books: ${booksError.message}`)
    }

    await supabase.auth.signOut()
    return NextResponse.json({ success: true })
  } catch (error) {
    return jsonInternalError('profile:delete', error)
  }
}
