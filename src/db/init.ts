import pool from "./pool";

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      user_id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL
    );

    -- If the table existed before with different constraints, ensure we have uniqueness
    -- needed for foreign keys and for upsert-by-email logic.
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_user_id_unique ON users(user_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email);

    UPDATE users SET name = COALESCE(name, '') WHERE name IS NULL;

    -- Fix for legacy schemas: ensure users.user_id auto-increments without collisions.
    -- If the sequence exists, sync it to MAX(user_id). If not, create one and attach it.
    DO $$
    DECLARE
      seq_name text;
      next_id bigint;
    BEGIN
      SELECT pg_get_serial_sequence('users', 'user_id') INTO seq_name;
      SELECT COALESCE(MAX(user_id), 0) + 1 INTO next_id FROM users;

      IF seq_name IS NULL THEN
        EXECUTE 'CREATE SEQUENCE IF NOT EXISTS users_user_id_seq';
        EXECUTE 'ALTER TABLE users ALTER COLUMN user_id SET DEFAULT nextval(''users_user_id_seq'')';
        seq_name := 'users_user_id_seq';
      END IF;

      -- set sequence to next_id (is_called = false => next nextval returns next_id)
      EXECUTE format('SELECT setval(%L, %s, false)', seq_name, next_id);
    END $$;

    CREATE TABLE IF NOT EXISTS visualisations (
      vis_id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      style TEXT NOT NULL,
      description TEXT NOT NULL,
      title TEXT NOT NULL,
      likes INTEGER NOT NULL DEFAULT 0,
      is_public BOOLEAN NOT NULL DEFAULT FALSE,
      img1 BYTEA NOT NULL,
      img2 BYTEA NOT NULL,
      img3 BYTEA NOT NULL,
      author TEXT NOT NULL,
      date_of_creation TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Same protection for visualisations primary key sequence.
    DO $$
    DECLARE
      seq_name text;
      next_id bigint;
    BEGIN
      SELECT pg_get_serial_sequence('visualisations', 'vis_id') INTO seq_name;
      SELECT COALESCE(MAX(vis_id), 0) + 1 INTO next_id FROM visualisations;

      IF seq_name IS NULL THEN
        EXECUTE 'CREATE SEQUENCE IF NOT EXISTS visualisations_vis_id_seq';
        EXECUTE 'ALTER TABLE visualisations ALTER COLUMN vis_id SET DEFAULT nextval(''visualisations_vis_id_seq'')';
        seq_name := 'visualisations_vis_id_seq';
      END IF;

      EXECUTE format('SELECT setval(%L, %s, false)', seq_name, next_id);
    END $$;

    CREATE TABLE IF NOT EXISTS visualisation_likes (
      user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      vis_id INTEGER NOT NULL REFERENCES visualisations(vis_id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, vis_id)
    );

    CREATE INDEX IF NOT EXISTS idx_visualisations_user_id_date ON visualisations(user_id, date_of_creation DESC);
    CREATE INDEX IF NOT EXISTS idx_visualisations_public_date ON visualisations(is_public, date_of_creation DESC);
  `);
}

