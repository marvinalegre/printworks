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
    .prepare<[number], { original_name: string; num_pages: number }>(
      `
    SELECT
      original_name,
      num_pages
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
            { name: user.username, href: "/myaccount" },
            { name: "log out", href: "/logout" },
          ]}
        />

        <main class="container">
          <FileUploader />

          <div id="settings">
            {files.map((f) => (
              // TODO: fill this out
              <FilePrintSettings
                filename={f.original_name}
                numPages={f.num_pages}
              />
            ))}
          </div>

          <form fx-action="/checkout" fx-method="post">
            <input type="hidden" name="userId" value={c.get("user").userId} />
            <button type="submit">Checkout</button>
          </form>
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
