-- Rune: Row Level Security Policies
-- Every table is locked to the authenticated user's own data.

-- Enable RLS on all tables
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE backlog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

-- Books: users can only access their own books
CREATE POLICY "Users can view own books"
  ON books FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create books"
  ON books FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own books"
  ON books FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own books"
  ON books FOR DELETE USING (auth.uid() = user_id);

-- Sessions: access via book ownership
CREATE POLICY "Users can view sessions for own books"
  ON sessions FOR SELECT USING (
    book_id IN (SELECT id FROM books WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can create sessions for own books"
  ON sessions FOR INSERT WITH CHECK (
    book_id IN (SELECT id FROM books WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can update sessions for own books"
  ON sessions FOR UPDATE USING (
    book_id IN (SELECT id FROM books WHERE user_id = auth.uid())
  );

-- Workspace Files: access via book ownership
CREATE POLICY "Users can view workspace files for own books"
  ON workspace_files FOR SELECT USING (
    book_id IN (SELECT id FROM books WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can create workspace files for own books"
  ON workspace_files FOR INSERT WITH CHECK (
    book_id IN (SELECT id FROM books WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can update workspace files for own books"
  ON workspace_files FOR UPDATE USING (
    book_id IN (SELECT id FROM books WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can delete workspace files for own books"
  ON workspace_files FOR DELETE USING (
    book_id IN (SELECT id FROM books WHERE user_id = auth.uid())
  );

-- Knowledge Entities: access via book ownership
CREATE POLICY "Users can view entities for own books"
  ON knowledge_entities FOR SELECT USING (
    book_id IN (SELECT id FROM books WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can create entities for own books"
  ON knowledge_entities FOR INSERT WITH CHECK (
    book_id IN (SELECT id FROM books WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can update entities for own books"
  ON knowledge_entities FOR UPDATE USING (
    book_id IN (SELECT id FROM books WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can delete entities for own books"
  ON knowledge_entities FOR DELETE USING (
    book_id IN (SELECT id FROM books WHERE user_id = auth.uid())
  );

-- Entity Relationships: access via book ownership
CREATE POLICY "Users can view relationships for own books"
  ON entity_relationships FOR SELECT USING (
    book_id IN (SELECT id FROM books WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can create relationships for own books"
  ON entity_relationships FOR INSERT WITH CHECK (
    book_id IN (SELECT id FROM books WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can delete relationships for own books"
  ON entity_relationships FOR DELETE USING (
    book_id IN (SELECT id FROM books WHERE user_id = auth.uid())
  );

-- Backlog Items: access via book ownership
CREATE POLICY "Users can view backlog for own books"
  ON backlog_items FOR SELECT USING (
    book_id IN (SELECT id FROM books WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can create backlog for own books"
  ON backlog_items FOR INSERT WITH CHECK (
    book_id IN (SELECT id FROM books WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can update backlog for own books"
  ON backlog_items FOR UPDATE USING (
    book_id IN (SELECT id FROM books WHERE user_id = auth.uid())
  );

-- Timeline Events: access via book ownership
CREATE POLICY "Users can view timeline for own books"
  ON timeline_events FOR SELECT USING (
    book_id IN (SELECT id FROM books WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can create timeline for own books"
  ON timeline_events FOR INSERT WITH CHECK (
    book_id IN (SELECT id FROM books WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can update timeline for own books"
  ON timeline_events FOR UPDATE USING (
    book_id IN (SELECT id FROM books WHERE user_id = auth.uid())
  );
