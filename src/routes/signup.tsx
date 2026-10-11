import { Hono } from "hono";
import { z } from "zod";

import { signupSchema } from "../lib/validation.js";
import { reservedUsernames } from "../lib/reserved-usernames.js";
import { db } from "../lib/db.js";

import { Nav } from "../components/nav.js";
import { Layout } from "../components/layout.js";
import { SignupForm } from "../components/signup-form.js";

export const signup = new Hono();

signup.get("/", (c) => {
  return c.html(
    <Layout>
      <Nav />

      <main class="container auth-page">
        <h1>Create an account</h1>

        <SignupForm />

        <p>
          Have an account? <a href="/login">Log in</a>
        </p>
      </main>
    </Layout>,
  );
});

signup.post("/", async (c) => {
  const body = await c.req.parseBody();
  const rawUsername = body.username;

  if (typeof rawUsername !== "string") {
    return c.text("Username must be a text value", 400);
  }

  const username = rawUsername.trim().toLowerCase();
  const result = signupSchema.safeParse({ ...body, username });

  const fieldErrors: Record<string, string[] | undefined> = result.success
    ? {}
    : z.flattenError(result.error).fieldErrors;

  // Check availability even if other fields failed, so every error shows.
  if (!fieldErrors.username && !isUsernameAvailable(username)) {
    fieldErrors.username = ["Username is not available"];
  }

  if (!result.success || fieldErrors.username) {
    return c.html(
      <SignupForm
        values={{ username: rawUsername }}
        fieldErrors={fieldErrors}
      />,
      422,
    );
  }
});

const usernameLookup = db.prepare(
  "SELECT 1 FROM users WHERE username = ? LIMIT 1",
);

function isUsernameAvailable(username: string): boolean {
  return (
    !reservedUsernames.includes(username) &&
    usernameLookup.get(username) == null
  );
}
