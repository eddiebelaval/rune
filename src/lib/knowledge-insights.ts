import type {
  EntityRelationship,
  EntityType,
  KnowledgeEntity,
} from '@/types/database'
import type {
  KnowledgeFile,
  KnowledgeFileMetadata,
  KnowledgeFileType,
} from '@/types/knowledge'

const FILE_TYPE_TO_ENTITY_TYPE: Partial<Record<KnowledgeFileType, EntityType>> = {
  characters: 'person',
  'world-building': 'place',
  'thematic-through-lines': 'theme',
  timeline: 'event',
}

const EMPTY_COUNTS: Record<EntityType, number> = {
  person: 0,
  place: 0,
  theme: 0,
  event: 0,
}

export interface DerivedKnowledgeEntity extends KnowledgeEntity {
  source_file_id: string
  current_semantic_version: string
  source_type: KnowledgeFile['source_type']
  confidence: number | null
  is_placeholder?: boolean
}

export interface DerivedEntityRelationship extends EntityRelationship {
  source_file_id: string
  confidence: number | null
}

export interface KnowledgeInsights {
  entities: DerivedKnowledgeEntity[]
  relationships: DerivedEntityRelationship[]
  countsByType: Record<EntityType, number>
  unresolved: DerivedKnowledgeEntity[]
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase()
}

function parseConfidence(metadata: KnowledgeFileMetadata | undefined): number | null {
  if (typeof metadata?.extraction_confidence === 'number') {
    return metadata.extraction_confidence
  }

  return null
}

function buildEntityAttributes(file: KnowledgeFile): Record<string, unknown> {
  return {
    file_type: file.file_type,
    scope: file.scope,
    folder_path: file.folder_path,
    source_type: file.source_type,
    current_semantic_version: file.current_semantic_version,
    confidence: parseConfidence(file.metadata),
    provenance: {
      source_session_id:
        typeof file.metadata?.source_session === 'string'
          ? file.metadata.source_session
          : typeof file.metadata?.last_interview_session === 'string'
            ? file.metadata.last_interview_session
            : null,
      updated_at: file.updated_at,
    },
  }
}

function buildEntityFromFile(file: KnowledgeFile): DerivedKnowledgeEntity | null {
  const entityType = FILE_TYPE_TO_ENTITY_TYPE[file.file_type]
  if (!entityType) {
    return null
  }

  const sourceSessionId =
    typeof file.metadata?.source_session === 'string'
      ? file.metadata.source_session
      : typeof file.metadata?.last_interview_session === 'string'
        ? file.metadata.last_interview_session
        : null

  return {
    id: file.id,
    book_id: file.book_id ?? '',
    entity_type: entityType,
    name: file.title,
    description: file.content,
    attributes: buildEntityAttributes(file),
    first_mentioned_session: sourceSessionId,
    mention_count:
      typeof file.metadata?.mention_count === 'number'
        ? file.metadata.mention_count
        : 1,
    created_at: file.created_at,
    updated_at: file.updated_at,
    source_file_id: file.id,
    current_semantic_version: file.current_semantic_version,
    source_type: file.source_type,
    confidence: parseConfidence(file.metadata),
  }
}

function buildPlaceholderEntity(
  name: string,
  relationshipFile: KnowledgeFile
): DerivedKnowledgeEntity {
  const sourceSessionId =
    typeof relationshipFile.metadata?.source_session === 'string'
      ? relationshipFile.metadata.source_session
      : typeof relationshipFile.metadata?.last_interview_session === 'string'
        ? relationshipFile.metadata.last_interview_session
        : null

  return {
    id: `placeholder:${normalizeName(name)}`,
    book_id: relationshipFile.book_id ?? '',
    entity_type: 'person',
    name,
    description: `Referenced in ${relationshipFile.title}`,
    attributes: {
      file_type: relationshipFile.file_type,
      placeholder: true,
      provenance: {
        source_file_id: relationshipFile.id,
        source_session_id: sourceSessionId,
      },
    },
    first_mentioned_session: sourceSessionId,
    mention_count: 1,
    created_at: relationshipFile.created_at,
    updated_at: relationshipFile.updated_at,
    source_file_id: relationshipFile.id,
    current_semantic_version: relationshipFile.current_semantic_version,
    source_type: relationshipFile.source_type,
    confidence: parseConfidence(relationshipFile.metadata),
    is_placeholder: true,
  }
}

function parseRelationshipLines(content: string) {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*]\s*/, ''))
    .map((line) => {
      const match = line.match(/^(.+?)\s+--\[(.+?)\]-->\s+(.+?)(?::\s*(.+))?$/)
      if (!match) {
        return null
      }

      return {
        from: match[1].trim(),
        type: match[2].trim(),
        to: match[3].trim(),
        description: match[4]?.trim() ?? '',
      }
    })
    .filter((relationship): relationship is NonNullable<typeof relationship> => Boolean(relationship))
}

export function buildKnowledgeInsights(files: KnowledgeFile[]): KnowledgeInsights {
  const entities: DerivedKnowledgeEntity[] = []
  const relationships: DerivedEntityRelationship[] = []
  const countsByType = { ...EMPTY_COUNTS }
  const entityByName = new Map<string, DerivedKnowledgeEntity>()

  for (const file of files) {
    const entity = buildEntityFromFile(file)
    if (!entity) {
      continue
    }

    entities.push(entity)
    countsByType[entity.entity_type] += 1
    entityByName.set(normalizeName(entity.name), entity)
  }

  const relationshipFiles = files.filter((file) => file.file_type === 'relationships-map')

  for (const file of relationshipFiles) {
    const parsedRelationships = parseRelationshipLines(file.content)

    for (const parsed of parsedRelationships) {
      let fromEntity = entityByName.get(normalizeName(parsed.from))
      if (!fromEntity) {
        fromEntity = buildPlaceholderEntity(parsed.from, file)
        entityByName.set(normalizeName(parsed.from), fromEntity)
        entities.push(fromEntity)
      }

      let toEntity = entityByName.get(normalizeName(parsed.to))
      if (!toEntity) {
        toEntity = buildPlaceholderEntity(parsed.to, file)
        entityByName.set(normalizeName(parsed.to), toEntity)
        entities.push(toEntity)
      }

      relationships.push({
        id: `${file.id}:${relationships.length + 1}`,
        book_id: file.book_id ?? '',
        from_entity_id: fromEntity.id,
        to_entity_id: toEntity.id,
        relationship_type: parsed.type,
        description: parsed.description,
        created_at: file.created_at,
        source_file_id: file.id,
        confidence: parseConfidence(file.metadata),
      })
    }
  }

  const connectedIds = new Set<string>()
  for (const relationship of relationships) {
    connectedIds.add(relationship.from_entity_id)
    connectedIds.add(relationship.to_entity_id)
  }

  const unresolved = entities.filter((entity) => {
    if (entity.is_placeholder) {
      return true
    }

    return entity.description.trim().length < 40 || !connectedIds.has(entity.id)
  })

  return {
    entities,
    relationships,
    countsByType,
    unresolved,
  }
}
