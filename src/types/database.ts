export type BookType = 'memoir' | 'fiction' | 'nonfiction';
export type QualityLevel = 'economy' | 'standard' | 'premium';
export type BookStatus = 'active' | 'paused' | 'completed';
export type SessionMode = 'guided' | 'freeform' | 'review';
export type Room = 'brainstorm' | 'drafts' | 'publish';
export type EntityType = 'person' | 'place' | 'theme' | 'event';
export type BacklogItemType = 'question' | 'contradiction' | 'thin_spot' | 'unexplored' | 'review' | 'idea';
export type BacklogStatus = 'open' | 'addressed' | 'dismissed';

export interface Book {
  id: string;
  user_id: string;
  title: string;
  book_type: BookType;
  quality_level: QualityLevel;
  status: BookStatus;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  book_id: string;
  session_number: number;
  mode: SessionMode | null;
  raw_transcript: string | null;
  summary: string | null;
  duration_seconds: number | null;
  created_at: string;
}

export interface WorkspaceFile {
  id: string;
  book_id: string;
  room: Room;
  category: string;
  title: string;
  content: string;
  source_session_id: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeEntity {
  id: string;
  book_id: string;
  entity_type: EntityType;
  name: string;
  description: string;
  attributes: Record<string, unknown>;
  first_mentioned_session: string | null;
  mention_count: number;
  created_at: string;
  updated_at: string;
}

export interface EntityRelationship {
  id: string;
  book_id: string;
  from_entity_id: string;
  to_entity_id: string;
  relationship_type: string;
  description: string;
  created_at: string;
}

export interface BacklogItem {
  id: string;
  book_id: string;
  item_type: BacklogItemType;
  content: string;
  priority: number;
  source_session_id: string | null;
  source_entity_id: string | null;
  status: BacklogStatus;
  created_at: string;
  addressed_at: string | null;
}

export interface TimelineEvent {
  id: string;
  book_id: string;
  event_date: string;
  description: string;
  entity_ids: string[];
  chapter_reference: string | null;
  created_at: string;
}

export interface Revision {
  id: string;
  book_id: string;
  workspace_file_id: string;
  session_id: string | null;
  content_before: string;
  content_after: string;
  revision_note: string | null;
  created_at: string;
}
