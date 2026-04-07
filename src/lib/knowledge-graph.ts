import { createServiceClient } from '@/lib/supabase'
import { KnowledgeBaseService } from '@/lib/database/knowledge-base'
import { buildKnowledgeInsights } from '@/lib/knowledge-insights'
import { inferFolderAndScope } from '@/types/folder-system'
import type { EntityRelationship, EntityType, KnowledgeEntity } from '@/types/database'
import type { KnowledgeFileType } from '@/types/knowledge'

type EntityInsert = Omit<KnowledgeEntity, 'id' | 'created_at' | 'updated_at' | 'mention_count'>
type EntityUpdate = Partial<
  Pick<KnowledgeEntity, 'name' | 'description' | 'attributes' | 'entity_type'>
>

export interface EntityNetwork {
  entities: KnowledgeEntity[]
  relationships: EntityRelationship[]
}

const ENTITY_TO_FILE_TYPE: Record<EntityType, KnowledgeFileType> = {
  person: 'characters',
  place: 'world-building',
  theme: 'thematic-through-lines',
  event: 'timeline',
}

async function getBookOwnerId(bookId: string): Promise<string> {
  const { data, error } = await createServiceClient()
    .from('books')
    .select('user_id')
    .eq('id', bookId)
    .single()

  if (error || !data?.user_id) {
    throw new Error('Book not found')
  }

  return data.user_id as string
}

async function getKnowledgeInsightsForBook(bookId: string) {
  const userId = await getBookOwnerId(bookId)
  const files = await KnowledgeBaseService.getFiles(userId, { book_id: bookId })
  return {
    userId,
    insights: buildKnowledgeInsights(files),
  }
}

export async function addEntity(
  bookId: string,
  type: EntityType,
  name: string,
  description?: string,
  attributes?: Record<string, unknown>,
  sessionId?: string
): Promise<KnowledgeEntity> {
  const userId = await getBookOwnerId(bookId)
  const fileType = ENTITY_TO_FILE_TYPE[type]
  const inferred = inferFolderAndScope(fileType)

  const file = await KnowledgeBaseService.createFile(userId, {
    book_id: bookId,
    title: name,
    content: description ?? '',
    file_type: fileType,
    scope: inferred.scope,
    folder_type: inferred.folder_type,
    folder_path: inferred.folder_path,
    is_active: true,
    source_type: 'ai-generated',
    metadata: {
      ...attributes,
      source_session: sessionId,
      mention_count: 1,
    },
  })

  return {
    id: file.id,
    book_id: file.book_id ?? bookId,
    entity_type: type,
    name: file.title,
    description: file.content,
    attributes: attributes ?? {},
    first_mentioned_session: sessionId ?? null,
    mention_count: 1,
    created_at: file.created_at,
    updated_at: file.updated_at,
  }
}

export async function getEntities(
  bookId: string,
  type?: EntityType
): Promise<KnowledgeEntity[]> {
  const { insights } = await getKnowledgeInsightsForBook(bookId)
  const entities = insights.entities.filter((entity) => !entity.is_placeholder)
  return type ? entities.filter((entity) => entity.entity_type === type) : entities
}

export async function updateEntity(
  id: string,
  updates: EntityUpdate
): Promise<KnowledgeEntity> {
  const existing = await KnowledgeBaseService.getFile(id)
  if (!existing) {
    throw new Error('Entity not found')
  }

  const nextFileType = updates.entity_type
    ? ENTITY_TO_FILE_TYPE[updates.entity_type]
    : existing.file_type
  const inferred = inferFolderAndScope(nextFileType)

  const updated = await KnowledgeBaseService.updateFile(id, {
    title: updates.name ?? existing.title,
    content: updates.description ?? existing.content,
    file_type: nextFileType,
    folder_type: inferred.folder_type,
    folder_path: inferred.folder_path,
    scope: inferred.scope,
    metadata: {
      ...(updates.attributes ?? {}),
      mention_count:
        typeof existing.metadata?.mention_count === 'number'
          ? existing.metadata.mention_count
          : 1,
    },
  })

  return {
    id: updated.id,
    book_id: updated.book_id ?? '',
    entity_type: updates.entity_type ?? ENTITY_TO_FILE_TYPE_REVERSE(updated.file_type),
    name: updated.title,
    description: updated.content,
    attributes: (updates.attributes ?? existing.metadata ?? {}) as Record<string, unknown>,
    first_mentioned_session:
      typeof updated.metadata?.source_session === 'string'
        ? updated.metadata.source_session
        : null,
    mention_count:
      typeof updated.metadata?.mention_count === 'number'
        ? updated.metadata.mention_count
        : 1,
    created_at: updated.created_at,
    updated_at: updated.updated_at,
  }
}

function ENTITY_TO_FILE_TYPE_REVERSE(fileType: string): EntityType {
  switch (fileType) {
    case 'characters':
      return 'person'
    case 'world-building':
      return 'place'
    case 'thematic-through-lines':
      return 'theme'
    case 'timeline':
      return 'event'
    default:
      return 'person'
  }
}

export async function incrementMentionCount(entityId: string): Promise<void> {
  const existing = await KnowledgeBaseService.getFile(entityId)
  if (!existing) {
    throw new Error('Entity not found')
  }

  const currentCount =
    typeof existing.metadata?.mention_count === 'number'
      ? existing.metadata.mention_count
      : 1

  await KnowledgeBaseService.updateFile(entityId, {
    metadata: {
      mention_count: currentCount + 1,
    },
  })
}

export async function addRelationship(
  bookId: string,
  fromId: string,
  toId: string,
  type: string,
  description?: string
): Promise<EntityRelationship> {
  const userId = await getBookOwnerId(bookId)
  const [fromEntity, toEntity] = await Promise.all([
    KnowledgeBaseService.getFile(fromId),
    KnowledgeBaseService.getFile(toId),
  ])

  if (!fromEntity || !toEntity) {
    throw new Error('Related entities not found')
  }

  const relationshipLine = `${fromEntity.title} --[${type}]--> ${toEntity.title}${
    description ? `: ${description}` : ''
  }`

  const files = await KnowledgeBaseService.getFiles(userId, {
    book_id: bookId,
    file_type: 'relationships-map',
  })
  const mapFile = files[0]

  if (mapFile) {
    await KnowledgeBaseService.updateFile(mapFile.id, {
      content: `${mapFile.content}\n${relationshipLine}`.trim(),
    })

    return {
      id: `${mapFile.id}:${Date.now()}`,
      book_id: bookId,
      from_entity_id: fromId,
      to_entity_id: toId,
      relationship_type: type,
      description: description ?? '',
      created_at: new Date().toISOString(),
    }
  }

  const created = await KnowledgeBaseService.createFile(userId, {
    book_id: bookId,
    title: 'Relationships Map',
    content: relationshipLine,
    file_type: 'relationships-map',
    is_active: true,
    source_type: 'ai-generated',
  })

  return {
    id: `${created.id}:1`,
    book_id: bookId,
    from_entity_id: fromId,
    to_entity_id: toId,
    relationship_type: type,
    description: description ?? '',
    created_at: created.created_at,
  }
}

export async function getRelationships(
  bookId: string,
  entityId?: string
): Promise<EntityRelationship[]> {
  const { insights } = await getKnowledgeInsightsForBook(bookId)
  const relationships = insights.relationships
  if (!entityId) {
    return relationships
  }

  return relationships.filter(
    (relationship) =>
      relationship.from_entity_id === entityId ||
      relationship.to_entity_id === entityId
  )
}

export async function getEntityNetwork(bookId: string): Promise<EntityNetwork> {
  const { insights } = await getKnowledgeInsightsForBook(bookId)
  return {
    entities: insights.entities,
    relationships: insights.relationships,
  }
}

export async function findUnresolved(bookId: string): Promise<KnowledgeEntity[]> {
  const { insights } = await getKnowledgeInsightsForBook(bookId)
  return insights.unresolved
}
