import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { CREATE_TABLE_SQL } from "./schema";

export type DB = Database.Database;

let _db: DB | null = null;

/** Open (and memoize) the SQLite database, ensuring the schema exists. */
export function getDb(path?: string): DB {
  if (_db) return _db;
  _db = openDb(path ?? process.env.DATABASE_PATH ?? "./data/shopfinder.db");
  return _db;
}

/** Open a fresh database at `path` (use ":memory:" for tests). Not memoized. */
export function openDb(path: string): DB {
  if (path !== ":memory:") {
    mkdirSync(dirname(resolve(path)), { recursive: true });
  }
  const db = new Database(path === ":memory:" ? ":memory:" : resolve(path));
  db.pragma("journal_mode = WAL");
  db.exec(CREATE_TABLE_SQL);
  return db;
}
