import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Node ships its own SQLite now, so there's no native module to compile and
// nothing to install. I wrap it in a thin helper that reads like the rest of
// the code: db.prepare(sql).all(...), .get(...), .run(...).

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, "..", "..", "..");
const DB_PATH = process.env.DB_PATH ?? resolve(ROOT, "data", "app.db");

let instance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (instance) return instance;
  instance = new DatabaseSync(DB_PATH);
  instance.exec("PRAGMA journal_mode = WAL;");
  instance.exec("PRAGMA foreign_keys = ON;");
  initSchema(instance);
  return instance;
}

function initSchema(db: DatabaseSync): void {
  const schema = readFileSync(resolve(here, "schema.sql"), "utf8");
  db.exec(schema);
}

/** Wipe every table — used by the demo seed so re-running is idempotent. */
export function resetTables(db: DatabaseSync): void {
  for (const table of [
    "play_history",
    "audio_features",
    "tracks",
    "artists",
    "sync_log",
    "auth_tokens",
  ]) {
    db.exec(`DELETE FROM ${table};`);
  }
}

export function rowCount(db: DatabaseSync, table: string): number {
  const row = db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as {
    n: number;
  };
  return row.n;
}
