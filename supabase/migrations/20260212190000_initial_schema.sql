-- Rune: Voice-First Conversational Book Writer — Initial Schema

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Books
CREATE TABLE books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  book_type text NOT NULL CHECK (book_type IN ('memoir', 'fiction', 'nonfiction')),
  quality_level text NOT NULL DEFAULT 'standard' CHECK (quality_level IN ('economy', 'standard', 'premium')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE TRIGGER books_updated_at BEFORE UPDATE ON books FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_books_user_id ON books(user_id);

-- Sessions
CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  session_number integer NOT NULL,
  mode text CHECK (mode IN ('guided', 'freeform', 'review')),
  raw_transcript text,
  summary text,
  duration_seconds integer,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_sessions_book_id ON sessions(book_id);

-- Workspace Files (Three Rooms)
CREATE TABLE workspace_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  room text NOT NULL CHECK (room IN ('brainstorm', 'drafts', 'publish')),
  category text NOT NULL,
  title text NOT NULL,
  content text DEFAULT '',
  source_session_id uuid REFERENCES sessions(id),
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE TRIGGER workspace_files_updated_at BEFORE UPDATE ON workspace_files FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_workspace_files_book_room ON workspace_files(book_id, room);

-- Knowledge Entities
CREATE TABLE knowledge_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('person', 'place', 'theme', 'event')),
  name text NOT NULL,
  description text DEFAULT '',
  attributes jsonb DEFAULT '{}',
  first_mentioned_session uuid REFERENCES sessions(id),
  mention_count integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE TRIGGER knowledge_entities_updated_at BEFORE UPDATE ON knowledge_entities FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_knowledge_entities_book_type ON knowledge_entities(book_id, entity_type);

-- Entity Relationships
CREATE TABLE entity_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  from_entity_id uuid NOT NULL REFERENCES knowledge_entities(id) ON DELETE CASCADE,
  to_entity_id uuid NOT NULL REFERENCES knowledge_entities(id) ON DELETE CASCADE,
  relationship_type text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Backlog Items
CREATE TABLE backlog_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('question', 'contradiction', 'thin_spot', 'unexplored', 'review', 'idea')),
  content text NOT NULL,
  priority integer DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  source_session_id uuid REFERENCES sessions(id),
  source_entity_id uuid REFERENCES knowledge_entities(id),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'addressed', 'dismissed')),
  created_at timestamptz DEFAULT now(),
  addressed_at timestamptz
);
CREATE INDEX idx_backlog_items_book_status ON backlog_items(book_id, status);

-- Timeline Events
CREATE TABLE timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  event_date text NOT NULL,
  description text NOT NULL,
  entity_ids uuid[] DEFAULT '{}',
  chapter_reference text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_timeline_events_book ON timeline_events(book_id);
