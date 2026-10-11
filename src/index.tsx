import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";

import { signup } from "./routes/signup.js";
import { login } from "./routes/login.js";

import { Layout } from "./components/layout.js";
import { Nav } from "./components/nav.js";

const app = new Hono();

app.use(
  "/public/*",
  serveStatic({
    root: "./public",
    rewriteRequestPath: (path) => path.replace(/^\/public/, ""),
  }),
);

app.get("/", (c) => {
  return c.html(
    <Layout>
      <Nav links={[{ name: "log in", href: "/login" }]} />
    </Layout>,
  );
});

app.route("/signup", signup);
app.route("/login", login);

serve(
  {
    fetch: app.fetch,
    port: 9001,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
