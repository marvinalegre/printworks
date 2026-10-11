import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";

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
      <Layout>
        <Nav
          links={[
            { name: user.username, href: "#" },
            { name: "log out", href: "/logout" },
          ]}
        />
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
