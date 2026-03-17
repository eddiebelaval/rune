-- Rune: World-Building Knowledge Base Migration
-- Evolves flat entity graph into hierarchical, scoped, versioned KB
-- Architecture derived from id8composer's knowledge_files system
-- Part of Phase 2 (KB Schema Migration) of the Rune Roadmap

-- =====================================================
-- PART A: Add pipeline_stage to books
-- =====================================================

ALTER TABLE books
ADD COLUMN pipeline_stage text NOT NULL DEFAULT 'world-building'
CHECK (pipeline_stage IN ('world-building', 'story-writing', 'publishing'));

-- =====================================================
-- PART B: Create knowledge_files table
-- =====================================================

CREATE TABLE knowledge_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  book_id uuid REFERENCES books(id) ON DELETE CASCADE,

  -- Content
  title text NOT NULL,
  content text NOT NULL DEFAULT '',

  -- Classification
  file_type text NOT NULL CHECK (file_type IN (
    'characters',
    'world-building',
    'story-planning',
    'chapter-outlines',
    'drafts',
    'sandbox',
    'research',
    'references',
    'lore',
    'relationships-map',
    'timeline',
    'character-journeys',
    'thematic-through-lines'
  )),

  -- Scope hierarchy (global sees all, regional sees global+regional, local sees all three)
  scope text NOT NULL DEFAULT 'global' CHECK (scope IN ('global', 'regional', 'local', 'session')),

  -- Folder organization
  folder_path text DEFAULT 'foundation/uncategorized',
  folder_type text NOT NULL DEFAULT 'foundation' CHECK (folder_type IN (
    'foundation',
    'strategy',
    'drafts',
    'sandbox',
    'production',
    'assets'
  )),

  -- Metadata
  tags text[] DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  source_type text DEFAULT 'voice-transcription' CHECK (source_type IN (
    'voice-transcription',
    'text-input',
    'ai-generated',
    'import',
    'interview'
  )),

  -- Version tracking
  current_version integer NOT NULL DEFAULT 1,
  current_semantic_version text NOT NULL DEFAULT '1.0.0',

  -- Draft-sandbox pairing
  linked_sandbox_id uuid REFERENCES knowledge_files(id) ON DELETE SET NULL,

  -- Soft delete
  deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER knowledge_files_updated_at
  BEFORE UPDATE ON knowledge_files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- PART C: Create knowledge_file_versions table
-- =====================================================

CREATE TABLE knowledge_file_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_file_id uuid NOT NULL REFERENCES knowledge_files(id) ON DELETE CASCADE,

  version integer NOT NULL,
  semantic_version text NOT NULL,

  content text NOT NULL,
  version_metadata jsonb DEFAULT '{}'::jsonb,
  kb_context jsonb DEFAULT '{}'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,

  CONSTRAINT unique_kb_version UNIQUE(knowledge_file_id, version)
);

-- =====================================================
-- PART D: Indexes
-- =====================================================

-- knowledge_files indexes
CREATE INDEX idx_kb_files_user_id ON knowledge_files(user_id);
CREATE INDEX idx_kb_files_book_id ON knowledge_files(book_id);
CREATE INDEX idx_kb_files_file_type ON knowledge_files(file_type);
CREATE INDEX idx_kb_files_scope ON knowledge_files(scope);
CREATE INDEX idx_kb_files_folder_type ON knowledge_files(folder_type);
CREATE INDEX idx_kb_files_active ON knowledge_files(is_active) WHERE is_active = true;
CREATE INDEX idx_kb_files_not_deleted ON knowledge_files(user_id, book_id) WHERE deleted = false;
CREATE INDEX idx_kb_files_tags ON knowledge_files USING gin(tags);
CREATE INDEX idx_kb_files_scope_active ON knowledge_files(book_id, scope, is_active) WHERE deleted = false;

-- knowledge_file_versions indexes
CREATE INDEX idx_kb_versions_file_id ON knowledge_file_versions(knowledge_file_id, version DESC);
CREATE INDEX idx_kb_versions_created_at ON knowledge_file_versions(created_at DESC);

-- books pipeline_stage index
CREATE INDEX idx_books_pipeline_stage ON books(pipeline_stage);

-- =====================================================
-- PART E: Row Level Security
-- =====================================================

ALTER TABLE knowledge_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_file_versions ENABLE ROW LEVEL SECURITY;

-- knowledge_files policies
CREATE POLICY "Users can view own KB files"
  ON knowledge_files FOR SELECT
  USING (user_id = auth.uid() AND deleted = false);

CREATE POLICY "Users can insert own KB files"
  ON knowledge_files FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own KB files"
  ON knowledge_files FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own KB files"
  ON knowledge_files FOR DELETE
  USING (user_id = auth.uid());

-- knowledge_file_versions policies (cascade through knowledge_files ownership)
CREATE POLICY "Users can view own KB versions"
  ON knowledge_file_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM knowledge_files kf
      WHERE kf.id = knowledge_file_id
      AND kf.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own KB versions"
  ON knowledge_file_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM knowledge_files kf
      WHERE kf.id = knowledge_file_id
      AND kf.user_id = auth.uid()
    )
  );

-- =====================================================
-- PART F: Helper functions
-- =====================================================

-- Get KB files by scope with inheritance
CREATE OR REPLACE FUNCTION get_kb_files_for_scope(
  p_user_id uuid,
  p_book_id uuid,
  p_scope text DEFAULT 'local',
  p_active_only boolean DEFAULT false
)
RETURNS SETOF knowledge_files AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM knowledge_files
  WHERE user_id = p_user_id
    AND (book_id = p_book_id OR book_id IS NULL)
    AND deleted = false
    AND (NOT p_active_only OR is_active = true)
    AND CASE p_scope
      WHEN 'global' THEN scope = 'global'
      WHEN 'regional' THEN scope IN ('global', 'regional')
      WHEN 'local' THEN scope IN ('global', 'regional', 'local')
      WHEN 'session' THEN scope IN ('global', 'regional', 'local', 'session')
      ELSE scope = 'global'
    END
  ORDER BY
    CASE folder_type
      WHEN 'foundation' THEN 1
      WHEN 'strategy' THEN 2
      WHEN 'drafts' THEN 3
      WHEN 'sandbox' THEN 4
      WHEN 'production' THEN 5
      WHEN 'assets' THEN 6
    END,
    updated_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create a new KB version (atomic: inserts version + updates main file)
CREATE OR REPLACE FUNCTION create_kb_version(
  p_knowledge_file_id uuid,
  p_content text,
  p_semantic_version text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS knowledge_file_versions AS $$
DECLARE
  v_new_version integer;
  v_semantic_version text;
  v_result knowledge_file_versions;
BEGIN
  -- Get next version number
  SELECT COALESCE(MAX(version), 0) + 1 INTO v_new_version
  FROM knowledge_file_versions
  WHERE knowledge_file_id = p_knowledge_file_id;

  -- Auto-increment patch version if not provided
  IF p_semantic_version IS NULL THEN
    SELECT
      split_part(current_semantic_version, '.', 1) || '.' ||
      split_part(current_semantic_version, '.', 2) || '.' ||
      (split_part(current_semantic_version, '.', 3)::integer + 1)::text
    INTO v_semantic_version
    FROM knowledge_files
    WHERE id = p_knowledge_file_id;
  ELSE
    v_semantic_version := p_semantic_version;
  END IF;

  -- Insert version snapshot
  INSERT INTO knowledge_file_versions (
    knowledge_file_id, version, semantic_version,
    content, version_metadata, created_by
  ) VALUES (
    p_knowledge_file_id, v_new_version, v_semantic_version,
    p_content, p_metadata, auth.uid()
  ) RETURNING * INTO v_result;

  -- Update main file
  UPDATE knowledge_files SET
    content = p_content,
    current_version = v_new_version,
    current_semantic_version = v_semantic_version,
    updated_at = now()
  WHERE id = p_knowledge_file_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Restore a previous version (creates new version with old content)
CREATE OR REPLACE FUNCTION restore_kb_version(
  p_knowledge_file_id uuid,
  p_version integer
)
RETURNS boolean AS $$
DECLARE
  v_content text;
BEGIN
  SELECT content INTO v_content
  FROM knowledge_file_versions
  WHERE knowledge_file_id = p_knowledge_file_id AND version = p_version;

  IF v_content IS NULL THEN RETURN false; END IF;

  PERFORM create_kb_version(
    p_knowledge_file_id,
    v_content,
    NULL,
    jsonb_build_object('restored_from_version', p_version, 'restored_at', now())
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PART G: Enable Realtime
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE knowledge_files;

-- =====================================================
-- PART H: Comments
-- =====================================================

COMMENT ON TABLE knowledge_files IS 'Hierarchical knowledge base for Rune world-building. Scoped (global/regional/local), versioned, with folder organization.';
COMMENT ON TABLE knowledge_file_versions IS 'Version history for knowledge files with content snapshots.';
COMMENT ON COLUMN knowledge_files.scope IS 'Visibility tier: global (entire project), regional (this arc/volume), local (current draft), session (temporary)';
COMMENT ON COLUMN knowledge_files.folder_type IS 'Organization layer: foundation (world bible, chars, locations), strategy (arcs, outlines), drafts/sandbox (working), production (final), assets (research)';
COMMENT ON COLUMN knowledge_files.file_type IS 'Semantic content type independent of folder location';
COMMENT ON COLUMN knowledge_files.source_type IS 'How this content was created: voice transcription, text input, AI generated, imported, or interview';
COMMENT ON COLUMN books.pipeline_stage IS 'Current stage in the three-stage pipeline: world-building, story-writing, publishing';
