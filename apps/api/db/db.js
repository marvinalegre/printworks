import Database from "better-sqlite3";

const db = new Database(process.env.SQLITE_DB_PATH);

export default db;
