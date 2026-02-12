import { createServerClient } from '@/lib/supabase';
import type { EntityType, KnowledgeEntity, EntityRelationship } from '@/types/database';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EntityInsert = Omit<KnowledgeEntity, 'id' | 'created_at' | 'updated_at' | 'mention_count'>;
type EntityUpdate = Partial<Pick<KnowledgeEntity, 'name' | 'description' | 'attributes' | 'entity_type'>>;

export interface EntityNetwork {
  entities: KnowledgeEntity[];
  relationships: EntityRelationship[];
}

// ---------------------------------------------------------------------------
// Entity Operations
// ---------------------------------------------------------------------------

/**
 * Add a new entity to the knowledge graph.
 */
export async function addEntity(
  bookId: string,
  type: EntityType,
  name: string,
  description?: string,
  attributes?: Record<string, unknown>,
  sessionId?: string,
): Promise<KnowledgeEntity> {
  const supabase = await createServerClient();

  const row: EntityInsert = {
    book_id: bookId,
    entity_type: type,
    name,
    description: description ?? '',
    attributes: attributes ?? {},
    first_mentioned_session: sessionId ?? null,
  };

  const { data, error } = await supabase
    .from('knowledge_entities')
    .insert(row)
    .select()
    .single();

  if (error) throw new Error(`Failed to add entity: ${error.message}`);
  return data as KnowledgeEntity;
}

/**
 * Get all entities for a book, optionally filtered by type.
 */
export async function getEntities(
  bookId: string,
  type?: EntityType,
): Promise<KnowledgeEntity[]> {
  const supabase = await createServerClient();

  let query = supabase
    .from('knowledge_entities')
    .select('*')
    .eq('book_id', bookId)
    .order('mention_count', { ascending: false });

  if (type) {
    query = query.eq('entity_type', type);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch entities: ${error.message}`);
  return (data ?? []) as KnowledgeEntity[];
}

/**
 * Update an entity by id.
 */
export async function updateEntity(
  id: string,
  updates: EntityUpdate,
): Promise<KnowledgeEntity> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('knowledge_entities')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update entity: ${error.message}`);
  return data as KnowledgeEntity;
}

/**
 * Increment the mention_count of an entity by 1.
 */
export async function incrementMentionCount(entityId: string): Promise<void> {
  const supabase = await createServerClient();

  // Fetch current count, then increment
  const { data: current, error: fetchError } = await supabase
    .from('knowledge_entities')
    .select('mention_count')
    .eq('id', entityId)
    .single();

  if (fetchError) throw new Error(`Failed to fetch entity for increment: ${fetchError.message}`);

  const newCount = ((current as { mention_count: number }).mention_count ?? 0) + 1;

  const { error: updateError } = await supabase
    .from('knowledge_entities')
    .update({ mention_count: newCount })
    .eq('id', entityId);

  if (updateError) throw new Error(`Failed to increment mention count: ${updateError.message}`);
}

// ---------------------------------------------------------------------------
// Relationship Operations
// ---------------------------------------------------------------------------

/**
 * Add a relationship between two entities.
 */
export async function addRelationship(
  bookId: string,
  fromId: string,
  toId: string,
  type: string,
  description?: string,
): Promise<EntityRelationship> {
  const supabase = await createServerClient();

  const row = {
    book_id: bookId,
    from_entity_id: fromId,
    to_entity_id: toId,
    relationship_type: type,
    description: description ?? '',
  };

  const { data, error } = await supabase
    .from('entity_relationships')
    .insert(row)
    .select()
    .single();

  if (error) throw new Error(`Failed to add relationship: ${error.message}`);
  return data as EntityRelationship;
}

/**
 * Get relationships for a book, optionally filtered to those involving a
 * specific entity (either as from or to).
 */
export async function getRelationships(
  bookId: string,
  entityId?: string,
): Promise<EntityRelationship[]> {
  const supabase = await createServerClient();

  if (entityId) {
    // Supabase doesn't support OR across columns in a single query builder
    // call cleanly, so we run two queries and merge.
    const [fromResult, toResult] = await Promise.all([
      supabase
        .from('entity_relationships')
        .select('*')
        .eq('book_id', bookId)
        .eq('from_entity_id', entityId),
      supabase
        .from('entity_relationships')
        .select('*')
        .eq('book_id', bookId)
        .eq('to_entity_id', entityId),
    ]);

    if (fromResult.error) throw new Error(`Failed to fetch relationships: ${fromResult.error.message}`);
    if (toResult.error) throw new Error(`Failed to fetch relationships: ${toResult.error.message}`);

    // Deduplicate by id
    const seen = new Set<string>();
    const merged: EntityRelationship[] = [];
    for (const rel of [...(fromResult.data ?? []), ...(toResult.data ?? [])]) {
      const r = rel as EntityRelationship;
      if (!seen.has(r.id)) {
        seen.add(r.id);
        merged.push(r);
      }
    }
    return merged;
  }

  const { data, error } = await supabase
    .from('entity_relationships')
    .select('*')
    .eq('book_id', bookId);

  if (error) throw new Error(`Failed to fetch relationships: ${error.message}`);
  return (data ?? []) as EntityRelationship[];
}

/**
 * Return the full knowledge graph for a book (entities + relationships).
 */
export async function getEntityNetwork(bookId: string): Promise<EntityNetwork> {
  const [entities, relationships] = await Promise.all([
    getEntities(bookId),
    getRelationships(bookId),
  ]);

  return { entities, relationships };
}

/**
 * Find entities that are "unresolved" — mentioned but lacking a description
 * or having zero relationships. These are candidates for the backlog.
 */
export async function findUnresolved(bookId: string): Promise<KnowledgeEntity[]> {
  const { entities, relationships } = await getEntityNetwork(bookId);

  // Build a set of entity ids that have at least one relationship
  const connected = new Set<string>();
  for (const rel of relationships) {
    connected.add(rel.from_entity_id);
    connected.add(rel.to_entity_id);
  }

  return entities.filter(
    (e) => !e.description || e.description.trim() === '' || !connected.has(e.id),
  );
}
