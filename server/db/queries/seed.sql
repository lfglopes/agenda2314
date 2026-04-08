INSERT OR IGNORE INTO events (id, title, description, start_at, end_at, location, status, submitter_email, created_at, updated_at)
VALUES
  ('evt-001', 'Fado Night', 'Uma noite de fado português.', '2026-04-15T20:00:00.000Z', '2026-04-15T23:00:00.000Z', 'Zur Wilden Renate, Berlin', 'approved', 'test@example.com', '2026-04-01T00:00:00.000Z', '2026-04-01T00:00:00.000Z'),
  ('evt-002', 'Cinema Português', 'Sessão de cinema com filmes portugueses.', '2026-04-22T19:00:00.000Z', '2026-04-22T22:00:00.000Z', 'Babylon Kino, Berlin', 'approved', 'test@example.com', '2026-04-01T00:00:00.000Z', '2026-04-01T00:00:00.000Z');
