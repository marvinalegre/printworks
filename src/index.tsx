import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";

import { Layout } from "./components/layout.js";
import { Nav } from "./components/nav.js";

const app = new Hono();

app.use("/*", serveStatic({ root: "./public" }));

app.get("/", (c) => {
  return c.html(
    <Layout>
      <Nav />
    </Layout>,
  );
});

serve(
  {
    fetch: app.fetch,
    port: 9001,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
