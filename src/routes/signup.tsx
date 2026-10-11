import { Hono } from "hono";

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
