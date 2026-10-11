import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";

import { db } from "../lib/db.js";
import type { AppEnv } from "../types/env.js";

export const authMiddleware = () =>
  createMiddleware<AppEnv>(async (c, next) => {
    const sessionId = getCookie(c, "session");
    const user =
      sessionId &&
      db
        .prepare<[string], { id: number; username: string } | undefined>(
          `
          SELECT users.id, username
          FROM users
          FULL JOIN sessions
          ON sessions.user_id = users.id
          WHERE sessions.id = ?
          `,
        )
        .get(sessionId);

    if (user) c.set("user", { userId: user.id, username: user.username });

    await next();
  });
