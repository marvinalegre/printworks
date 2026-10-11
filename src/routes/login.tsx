import { Hono } from "hono";

import { Nav } from "../components/nav.js";
import { Layout } from "../components/layout.js";
import { LoginForm } from "../components/login-form.js";

export const login = new Hono();

login.get("/", (c) => {
  return c.html(
    <Layout>
      <Nav />

      <main class="container auth-page">
        <h1>Log in</h1>

        <LoginForm />

        <p>
          No account? <a href="/signup">Sign up</a>
        </p>
      </main>
    </Layout>,
  );
});
