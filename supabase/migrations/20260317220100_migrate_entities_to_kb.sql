-- Rune: Migrate existing entity graph data to knowledge_files
-- Preserves all data in old tables for rollback safety
-- Part of Phase 2, Task 6

-- Migrate knowledge_entities -> knowledge_files
-- person -> characters (foundation/global)
-- place -> world-building (foundation/global)
-- theme -> thematic-through-lines (strategy/regional)
-- event -> timeline (foundation/global)

INSERT INTO knowledge_files (
  user_id, book_id, title, content, file_type, scope,
  folder_type, folder_path, source_type, metadata,
  is_active, current_version, current_semantic_version,
  created_at, updated_at
)
SELECT
  b.user_id,
  ke.book_id,
  ke.name,
  COALESCE(ke.description, '') || E'\n\n' ||
    CASE WHEN ke.attributes::text != '{}' AND ke.attributes::text != 'null'
      THEN 'Attributes: ' || ke.attributes::text
      ELSE ''
    END,
  CASE ke.entity_type
    WHEN 'person' THEN 'characters'
    WHEN 'place' THEN 'world-building'
    WHEN 'theme' THEN 'thematic-through-lines'
    WHEN 'event' THEN 'timeline'
  END::text,
  CASE ke.entity_type
    WHEN 'person' THEN 'global'
    WHEN 'place' THEN 'global'
    WHEN 'theme' THEN 'regional'
    WHEN 'event' THEN 'global'
  END::text,
  CASE ke.entity_type
    WHEN 'person' THEN 'foundation'
    WHEN 'place' THEN 'foundation'
    WHEN 'theme' THEN 'strategy'
    WHEN 'event' THEN 'foundation'
  END::text,
  CASE ke.entity_type
    WHEN 'person' THEN 'foundation/characters'
    WHEN 'place' THEN 'foundation/world-building'
    WHEN 'theme' THEN 'strategy/thematic-through-lines'
    WHEN 'event' THEN 'foundation/timeline'
  END::text,
  'ai-generated',
  jsonb_build_object(
    'migrated_from', 'knowledge_entities',
    'original_entity_id', ke.id,
    'original_entity_type', ke.entity_type,
    'mention_count', ke.mention_count,
    'word_count', array_length(string_to_array(COALESCE(ke.description, ''), ' '), 1)
  ),
  true,
  1,
  '1.0.0',
  ke.created_at,
  ke.updated_at
FROM knowledge_entities ke
JOIN books b ON b.id = ke.book_id;

-- Create initial version records for migrated files
INSERT INTO knowledge_file_versions (
  knowledge_file_id, version, semantic_version, content,
  version_metadata, created_at
)
SELECT
  kf.id,
  1,
  '1.0.0',
  kf.content,
  jsonb_build_object(
    'migrated', true,
    'migration_date', now(),
    'source', 'knowledge_entities'
  ),
  kf.created_at
FROM knowledge_files kf
WHERE (kf.metadata->>'migrated_from') = 'knowledge_entities';

-- Migrate entity_relationships into relationship entries in knowledge_files
-- Each relationship becomes a line in a Relationships Map KB file per book
INSERT INTO knowledge_files (
  user_id, book_id, title, content, file_type, scope,
  folder_type, folder_path, source_type, metadata,
  is_active, current_version, current_semantic_version,
  created_at
)
SELECT DISTINCT ON (er.book_id)
  b.user_id,
  er.book_id,
  'Relationships Map',
  string_agg(
    from_e.name || ' --[' || er.relationship_type || ']--> ' || to_e.name ||
    CASE WHEN er.description != '' THEN ' (' || er.description || ')' ELSE '' END,
    E'\n'
    ORDER BY er.created_at
  ),
  'relationships-map',
  'global',
  'foundation',
  'foundation/relationships-map',
  'ai-generated',
  jsonb_build_object('migrated_from', 'entity_relationships'),
  true,
  1,
  '1.0.0',
  min(er.created_at)
FROM entity_relationships er
JOIN books b ON b.id = er.book_id
JOIN knowledge_entities from_e ON from_e.id = er.from_entity_id
JOIN knowledge_entities to_e ON to_e.id = er.to_entity_id
GROUP BY er.book_id, b.user_id;

-- Migrate timeline_events into a Timeline KB file per book
INSERT INTO knowledge_files (
  user_id, book_id, title, content, file_type, scope,
  folder_type, folder_path, source_type, metadata,
  is_active, current_version, current_semantic_version,
  created_at
)
SELECT DISTINCT ON (te.book_id)
  b.user_id,
  te.book_id,
  'Timeline',
  string_agg(
    te.event_date || ': ' || te.description ||
    CASE WHEN te.chapter_reference IS NOT NULL THEN ' [Ch: ' || te.chapter_reference || ']' ELSE '' END,
    E'\n'
    ORDER BY te.event_date
  ),
  'timeline',
  'global',
  'foundation',
  'foundation/timeline',
  'ai-generated',
  jsonb_build_object('migrated_from', 'timeline_events'),
  true,
  1,
  '1.0.0',
  min(te.created_at)
FROM timeline_events te
JOIN books b ON b.id = te.book_id
GROUP BY te.book_id, b.user_id;

-- DO NOT drop old tables -- keep for rollback
-- Old tables: knowledge_entities, entity_relationships, timeline_events
