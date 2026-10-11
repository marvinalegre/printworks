import Database from "better-sqlite3";
import path from "node:path";

const dbPath = path.join("/var/lib/printworks/dev.db");

export const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
