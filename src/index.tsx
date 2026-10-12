import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";

import { type AppEnv } from "./types/env.js";

import { home } from "./routes/home.js";
import { signup } from "./routes/signup.js";
import { login } from "./routes/login.js";
import { logout } from "./routes/logout.js";
import { upload } from "./routes/upload.js";

import { authMiddleware } from "./middlewares/auth.js";

const app = new Hono<AppEnv>();

app.use(
  "/public/*",
  serveStatic({
    root: "./public",
    rewriteRequestPath: (path) => path.replace(/^\/public/, ""),
  }),
);

app.use("/*", authMiddleware());

app.route("/", home);
app.route("/signup", signup);
app.route("/login", login);
app.route("/logout", logout);
app.route("/upload", upload);

serve(
  {
    fetch: app.fetch,
    port: 9001,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
