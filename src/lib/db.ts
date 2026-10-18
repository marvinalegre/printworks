import Database from "better-sqlite3";

const dbPath = "/var/lib/printworks/dev.db";

export const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
