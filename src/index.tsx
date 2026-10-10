import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";

import { Layout } from "./components/layout.js";

const app = new Hono();

app.use("/*", serveStatic({ root: "./public" }));

app.get("/", (c) => {
  return c.html(
    <Layout>
      <h1>Hello Hono!</h1>
    </Layout>,
  );
});

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
