CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    pin VARCHAR(4) NOT NULL
);

CREATE TABLE IF NOT EXISTS notes (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    CONSTRAINT unique_note UNIQUE (username, content)
);

INSERT INTO users (username, pin)
VALUES
    ('admin', '0042'),
    ('ana', '1234'),
    ('marko', '5678')
ON CONFLICT (username) DO NOTHING;

INSERT INTO notes (username, content)
VALUES
    ('admin', 'adminova tajna'),
    ('ana', 'anina biljeska'),
    ('marko', 'markova biljeska'),
    ('admin', 'admin v2')
ON CONFLICT (username, content) DO NOTHING;