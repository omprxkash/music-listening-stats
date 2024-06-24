-- Everything I know about the music I listen to lives in these few tables.
-- It's a small, boring, dependable schema on purpose.

CREATE TABLE IF NOT EXISTS tracks (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  artist_ids  TEXT NOT NULL,           -- comma separated artist ids
  album_id    TEXT,
  album_name  TEXT,
  duration_ms INTEGER,
  popularity  INTEGER,
  preview_url TEXT,
  image_url   TEXT
);

CREATE TABLE IF NOT EXISTS artists (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  genres     TEXT,                      -- comma separated genres
  popularity INTEGER,
  image_url  TEXT
);

CREATE TABLE IF NOT EXISTS audio_features (
  track_id         TEXT PRIMARY KEY REFERENCES tracks(id),
  danceability     REAL,
  energy           REAL,
  key              INTEGER,
  loudness         REAL,
  mode             INTEGER,
  speechiness      REAL,
  acousticness     REAL,
  instrumentalness REAL,
  liveness         REAL,
  valence          REAL,
  tempo            REAL,
  time_signature   INTEGER
);

CREATE TABLE IF NOT EXISTS play_history (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  track_id     TEXT REFERENCES tracks(id),
  played_at    TEXT NOT NULL,           -- ISO timestamp
  context_type TEXT,
  context_uri  TEXT
);

CREATE TABLE IF NOT EXISTS sync_log (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  synced_at    TEXT NOT NULL,
  tracks_added INTEGER,
  cursor       TEXT
);

-- One row, holds the current Spotify tokens. Tiny but handy.
CREATE TABLE IF NOT EXISTS auth_tokens (
  id            INTEGER PRIMARY KEY CHECK (id = 1),
  access_token  TEXT,
  refresh_token TEXT,
  expires_at    INTEGER
);

CREATE INDEX IF NOT EXISTS idx_play_history_played_at ON play_history(played_at);
CREATE INDEX IF NOT EXISTS idx_play_history_track ON play_history(track_id);
