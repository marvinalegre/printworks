import { Hono } from "hono";

import { type AppEnv } from "../types/env.js";
import { db } from "../lib/db.js";

import { Nav } from "../components/nav.js";
import { Layout } from "../components/layout.js";
import { FileUploader } from "../components/file-uploader.js";
import { FilePrintSettings } from "../components/file-print-settings.js";

export const home = new Hono<AppEnv>();

home.get("/", (c) => {
  const user = c.get("user");

  const files = db
    .prepare<[number], { original_name: string }>(
      `
    SELECT original_name
    FROM files
    FULL JOIN orders ON orders.id = files.order_id
    FULL JOIN users ON users.id = orders.user_id
    WHERE orders.status = 'new'
      AND users.id = ?
    `,
    )
    .all(c.get("user").userId);

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
          <FileUploader />

          <div id="settings">
            {files.map((f) => (
              <FilePrintSettings filename={f.original_name} />
            ))}
          </div>
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
