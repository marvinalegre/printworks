import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const migrationsDir = path.join(process.cwd(), "migrations");
const dbPath = "/var/lib/printworks/dev.db";

const db = new Database(dbPath);

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function timestamp() {
  const now = new Date();

  return (
    now.getUTCFullYear() +
    pad(now.getUTCMonth() + 1) +
    pad(now.getUTCDate()) +
    pad(now.getUTCHours()) +
    pad(now.getUTCMinutes()) +
    pad(now.getUTCSeconds())
  );
}

function parseMigration(sql: string) {
  const upMarker = "-- UP";
  const downMarker = "-- DOWN";

  const upStart = sql.indexOf(upMarker);
  const downStart = sql.indexOf(downMarker);

  if (upStart === -1) {
    throw new Error("Migration is missing a '-- UP' section.");
  }

  if (downStart === -1) {
    throw new Error("Migration is missing a '-- DOWN' section.");
  }

  if (downStart < upStart) {
    throw new Error("'-- DOWN' appears before '-- UP'.");
  }

  return {
    up: sql.slice(upStart + upMarker.length, downStart).trim(),

    down: sql.slice(downStart + downMarker.length).trim(),
  };
}

function sanitizeName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function ensureMigrationTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function getMigrationFiles() {
  if (!fs.existsSync(migrationsDir)) {
    return [];
  }

  return fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();
}

function getAppliedMigrations() {
  return db
    .prepare(
      `
      SELECT name
      FROM schema_migrations
      ORDER BY id
    `,
    )
    .all()
    .map((row) => (row as { name: string }).name);
}

function createMigration(name: string) {
  if (!name) {
    console.error("Usage: migration:create <name>");
    process.exit(1);
  }

  const cleanName = sanitizeName(name);

  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
  }

  const filename = `${timestamp()}_${cleanName}.sql`;
  const filepath = path.join(migrationsDir, filename);

  if (fs.existsSync(filepath)) {
    console.error("Migration already exists");
    process.exit(1);
  }

  const template = `-- Migration: ${cleanName}

-- UP
-- Write your migration here

-- DOWN
-- Write your rollback here
`;

  fs.writeFileSync(filepath, template);

  console.log(`Created ${filepath}`);
}

function migrateUp() {
  ensureMigrationTable();

  const files = getMigrationFiles();
  const applied = getAppliedMigrations();

  const pending = files.filter((file) => !applied.includes(file));

  if (pending.length === 0) {
    console.log("No pending migrations");
    return;
  }

  for (const file of pending) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");

    db.transaction(() => {
      const { up } = parseMigration(sql);

      db.exec(up);

      db.prepare(
        `
        INSERT INTO schema_migrations(name)
        VALUES(?)
      `,
      ).run(file);
    })();

    console.log(`Applied ${file}`);
  }
}

function migrateDown() {
  ensureMigrationTable();

  const latest = db
    .prepare(
      `
    SELECT name
    FROM schema_migrations
    ORDER BY id DESC
    LIMIT 1
  `,
    )
    .get() as { name: string } | undefined;

  if (!latest) {
    console.log("No migrations to rollback.");
    return;
  }

  const filepath = path.join(migrationsDir, latest.name);

  if (!fs.existsSync(filepath)) {
    throw new Error(`Migration file not found: ${latest.name}`);
  }

  const sql = fs.readFileSync(filepath, "utf8");
  const { down } = parseMigration(sql);

  db.transaction(() => {
    db.exec(down);

    db.prepare(
      `
      DELETE FROM schema_migrations
      WHERE name = ?
    `,
    ).run(latest.name);
  })();

  console.log(`Rolled back ${latest.name}`);
}

function migrationStatus() {
  ensureMigrationTable();

  const files = getMigrationFiles();
  const applied = getAppliedMigrations();

  for (const file of files) {
    const status = applied.includes(file) ? "✓" : "✗";

    console.log(`${status} ${file}`);
  }
}

function resetDatabase() {
  ensureMigrationTable();

  while (true) {
    const latest = db
      .prepare(
        `
      SELECT name
      FROM schema_migrations
      ORDER BY id DESC
      LIMIT 1
    `,
      )
      .get();

    if (!latest) {
      break;
    }

    migrateDown();
  }

  console.log("Database reset");
}

function freshDatabase() {
  const tables = db
    .prepare(
      `
      SELECT name
      FROM sqlite_master
      WHERE type='table'
      AND name NOT LIKE 'sqlite_%'
    `,
    )
    .all()
    .map((row) => (row as { name: string }).name);

  db.pragma("foreign_keys = OFF");

  for (const table of tables) {
    db.exec(`DROP TABLE "${table}"`);
  }

  console.log("Database cleared");

  migrateUp();
}

const command = process.argv[2];

switch (command) {
  case "create":
    createMigration(process.argv.slice(3).join(" "));
    break;

  case "up":
    migrateUp();
    break;

  case "down":
    migrateDown();
    break;

  case "status":
    migrationStatus();
    break;

  case "reset":
    resetDatabase();
    break;

  case "fresh":
    freshDatabase();
    break;

  default:
    console.log(`
Usage:

  migration:create <name>
  migration:up
  migration:down
  migration:status
  migration:reset
  migration:fresh
`);
}
