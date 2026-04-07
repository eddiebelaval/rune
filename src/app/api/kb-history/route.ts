import { NextRequest, NextResponse } from 'next/server';
import {
  jsonBadRequest,
  jsonInternalError,
  jsonNotFound,
  jsonTooManyRequests,
  parseJsonBody,
  requireAuthenticatedRouteContext,
} from '@/lib/api/route';
import { KnowledgeBaseService } from '@/lib/database/knowledge-base';
import { buildRateLimitKey, enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { isValidUUID } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const context = await requireAuthenticatedRouteContext();
    if (context instanceof NextResponse) {
      return context;
    }

    const { user } = context;
    const fileId = request.nextUrl.searchParams.get('fileId');

    if (!fileId || !isValidUUID(fileId)) {
      return jsonBadRequest('fileId query parameter is required');
    }

    const file = await KnowledgeBaseService.getFile(fileId);
    if (!file || file.user_id !== user.id) {
      return jsonNotFound('KB file not found');
    }

    const versions = await KnowledgeBaseService.getVersionHistory(fileId, 10);
    return NextResponse.json({
      file: {
        id: file.id,
        title: file.title,
        file_type: file.file_type,
        current_version: file.current_version,
        current_semantic_version: file.current_semantic_version,
        source_type: file.source_type,
        updated_at: file.updated_at,
        metadata: file.metadata,
      },
      versions,
    });
  } catch (error) {
    return jsonInternalError('kb-history', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await requireAuthenticatedRouteContext();
    if (context instanceof NextResponse) {
      return context;
    }

    const { user } = context;
    const limit = enforceRateLimit(
      buildRateLimitKey(request, 'kb-history:restore', user.id),
      RATE_LIMITS.kbHistoryRestore,
    );

    if (!limit.allowed) {
      return jsonTooManyRequests({
        ...limit,
        error: 'Too many restore attempts. Please wait a moment before trying again.',
      });
    }

    const parsed = await parseJsonBody<{ fileId?: string; version?: number }>(request);
    if (!parsed.ok) {
      return parsed.response;
    }

    const { fileId, version } = parsed.data;
    if (!fileId || !isValidUUID(fileId)) {
      return jsonBadRequest('fileId is required');
    }
    if (!version || typeof version !== 'number') {
      return jsonBadRequest('version is required');
    }

    const file = await KnowledgeBaseService.getFile(fileId);
    if (!file || file.user_id !== user.id) {
      return jsonNotFound('KB file not found');
    }

    const restored = await KnowledgeBaseService.restoreVersion(fileId, version);
    if (!restored) {
      return jsonNotFound('Requested KB version was not found');
    }

    return NextResponse.json({ restored: true });
  } catch (error) {
    return jsonInternalError('kb-history', error);
  }
}
