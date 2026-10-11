import { Hono } from "hono";
import { z } from "zod";

import { signupSchema } from "../lib/validation.js";

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
  const result = signupSchema.safeParse(body);

  if (!result.success) {
    const errors = z.flattenError(result.error);

    return c.html(
      <SignupForm
        values={{
          username: typeof body.username === "string" ? body.username : "",
        }}
        fieldErrors={errors.fieldErrors}
      />,
      422,
    );
  }
});
