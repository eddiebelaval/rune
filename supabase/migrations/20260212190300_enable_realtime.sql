-- Enable Supabase Realtime for tables with client subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE workspace_files;
ALTER PUBLICATION supabase_realtime ADD TABLE backlog_items;
ALTER PUBLICATION supabase_realtime ADD TABLE knowledge_entities;
