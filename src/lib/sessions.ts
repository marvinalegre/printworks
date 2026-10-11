import { randomBytes } from "node:crypto";
import { db } from "./db.js";

export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

// Matches the format of SQLite's strftime('%Y-%m-%dT%H:%M:%fZ') used in created_at
function toSqliteTime(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

const insertSession = db.prepare(
  "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)",
);
const findValidSession = db.prepare<[string, string], { user_id: number }>(
  "SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?",
);
const deleteSession = db.prepare("DELETE FROM sessions WHERE id = ?");
const deleteExpiredSessions = db.prepare(
  "DELETE FROM sessions WHERE expires_at <= ?",
);

export function createSession(userId: number): string {
  const sessionId = randomBytes(32).toString("hex");
  const expiresAt = toSqliteTime(new Date(Date.now() + SESSION_TTL_MS));
  insertSession.run(sessionId, userId, expiresAt);
  return sessionId;
}

export function getUserIdForSession(sessionId: string): number | undefined {
  return findValidSession.get(sessionId, toSqliteTime(new Date()))?.user_id;
}

export function removeSession(sessionId: string): void {
  deleteSession.run(sessionId);
}

export function cleanupExpiredSessions(): number {
  return deleteExpiredSessions.run(toSqliteTime(new Date())).changes;
}
