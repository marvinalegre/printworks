import { Hono } from "hono";

import { type AppEnv } from "../types/env.js";

import { Nav } from "../components/nav.js";
import { Layout } from "../components/layout.js";

export const home = new Hono<AppEnv>();

home.get("/", (c) => {
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
