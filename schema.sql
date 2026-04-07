CREATE TABLE IF NOT EXISTS subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    firstname TEXT,
    lastname TEXT,
    language TEXT,
    mod_sub TEXT DEFAULT 'false',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS temp_tokens (
    token TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    expires INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
CREATE INDEX IF NOT EXISTS idx_temp_tokens_expires ON temp_tokens(expires);
