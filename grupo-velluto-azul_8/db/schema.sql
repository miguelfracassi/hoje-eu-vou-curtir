-- Opcional: a API cria estas tabelas sozinha na primeira requisição.
CREATE TABLE IF NOT EXISTS users (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  phone       TEXT NOT NULL,
  pass_hash   TEXT NOT NULL,
  is_client   BOOLEAN NOT NULL DEFAULT FALSE,
  is_admin    BOOLEAN NOT NULL DEFAULT FALSE,
  status      TEXT NOT NULL DEFAULT 'active',      -- active | deactivated
  theme       TEXT NOT NULL DEFAULT 'light',       -- light | dark | auto
  lang        TEXT NOT NULL DEFAULT 'pt',          -- pt | en | es
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS invoices (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  due_date    DATE,
  paid        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS projects (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'Em andamento',
  note        TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
