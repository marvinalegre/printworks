import { Hono } from "hono";
import { setCookie } from "hono/cookie";

import { db } from "@/lib/db.js";
import { verifyPassword } from "@/lib/password.js";
import {
  SESSION_TTL_MS,
  createSession,
  cleanupExpiredSessions,
} from "@/lib/sessions.js";

import { Nav } from "@/components/nav.js";
import { Layout } from "@/components/layout.js";
import { LoginForm } from "@/components/login-form.js";

export const login = new Hono();

login.get("/", (c) => {
  return c.html(
    <Layout js={["auth.js"]}>
      <Nav />

      <main class="container auth-page">
        <h1>Welcome back</h1>

        <LoginForm />

        <p>
          No account? <a href="/signup">Sign up</a>
        </p>
      </main>
    </Layout>,
  );
});

login.post("/", async (c) => {
  const body = await c.req.parseBody();

  if (typeof body.username !== "string" || typeof body.password !== "string") {
    return c.text("Username and password must be text values", 400);
  }

  const username = body.username.toLowerCase();
  interface UserRow {
    id: number;
    username: string;
    password_hash: string;
  }
  const user = db
    .prepare<[string], UserRow>(
      "SELECT id, username, password_hash FROM users where username = ?",
    )
    .get(username);

  if (!user || !(await verifyPassword(body.password, user.password_hash))) {
    return c.html(
      <LoginForm
        values={{ username: body.username }}
        formError="Incorrect username or password."
      />,
      401,
    );
  }

  const sessionId = createSession(user.id);

  setCookie(c, "session", sessionId, {
    httpOnly: true,
    secure: false, // use .env here
    sameSite: "Lax",
    maxAge: SESSION_TTL_MS / 1000,
    path: "/",
  });

  cleanupExpiredSessions();

  return c.newResponse(null, 200, {
    "FX-Redirect": "/",
  });
});
