-- Seed master user (MasterSRK / Open@002)
-- Password hash generated with bcrypt for 'Open@002'
-- Hash: $2b$10$mWqE6YQzX8nK8YvH5xJ5/OKJFhVQYF9DvP0hZhKVp0m7sN8dZ7Jby
INSERT INTO users (username, password_hash, full_name, role, can_create_users)
VALUES (
  'MasterSRK',
  '$2b$10$mWqE6YQzX8nK8YvH5xJ5/OKJFhVQYF9DvP0hZhKVp0m7sN8dZ7Jby',
  'Master Administrator',
  'master',
  true
)
ON CONFLICT (username) DO NOTHING;
