import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { signup } from "./routes/signup.js";
import { login } from "./routes/login.js";
import { type AppEnv } from "./types/env.js";
import { authMiddleware } from "./middlewares/auth.js";
import { deleteCookie, getCookie } from "hono/cookie";
import { removeSession } from "./lib/sessions.js";

import { Layout } from "./components/layout.js";
import { Nav } from "./components/nav.js";

const app = new Hono<AppEnv>();

app.use(
  "/public/*",
  serveStatic({
    root: "./public",
    rewriteRequestPath: (path) => path.replace(/^\/public/, ""),
  }),
);

app.use("/*", authMiddleware());

app.post("/upload", async (c) => {
  // TODO: protect this route

  const UPLOAD_DIR = "/var/lib/printworks/files/";
  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  const contentLength = Number(c.req.header("content-length") ?? 0);

  if (contentLength > MAX_FILE_SIZE + 64 * 1024) {
    return c.json({ error: "File is too large" }, 413);
  }

  const body = await c.req.parseBody();
  const file = body["file"];

  if (!(file instanceof File)) {
    return c.json({ error: "No file uploaded" }, 400);
  }

  if (file.size === 0) {
    return c.json({ error: "File is empty" }, 400);
  }

  // Keep only the base name to prevent path traversal, then add a unique prefix
  const safeName = path.basename(file.name).replace(/[^a-zA-Z0-9._-]/g, "_");
  const storedName = `${randomUUID()}-${safeName}`;
  const filePath = path.join(UPLOAD_DIR, storedName);

  await writeFile(filePath, new Uint8Array(await file.arrayBuffer()));

  return c.html(<p>hit</p>);
});

app.post("/logout", (c) => {
  const sessionId = getCookie(c, "session");

  if (sessionId) {
    removeSession(sessionId);
  }

  deleteCookie(c, "session", { path: "/" });

  return c.newResponse(null, 200, {
    "FX-Redirect": "/login",
  });
});

app.get("/", (c) => {
  const user = c.get("user");

  if (user) {
    return c.html(
      <Layout js={["upload.js"]}>
        <Nav
          links={[
            { name: user.username, href: "#" },
            { name: "log out", href: "/logout" },
          ]}
        />

        <main class="container">
          <input type="file" id="fileInput" />
          <button id="upload">Upload</button>
        </main>
      </Layout>,
    );
  }

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
