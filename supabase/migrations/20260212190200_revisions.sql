-- Rune: Revision Tracking — before/after snapshots of workspace file edits

CREATE TABLE revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  workspace_file_id uuid NOT NULL REFERENCES workspace_files(id) ON DELETE CASCADE,
  session_id uuid REFERENCES sessions(id),
  content_before text NOT NULL,
  content_after text NOT NULL,
  revision_note text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_revisions_file ON revisions(workspace_file_id);
CREATE INDEX idx_revisions_book ON revisions(book_id);
CREATE INDEX idx_revisions_session ON revisions(session_id);

-- Enable RLS
ALTER TABLE revisions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can view/create revisions for files in their own books
CREATE POLICY "Users can view revisions for own books"
  ON revisions FOR SELECT USING (
    book_id IN (SELECT id FROM books WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create revisions for own books"
  ON revisions FOR INSERT WITH CHECK (
    book_id IN (SELECT id FROM books WHERE user_id = auth.uid())
  );
