import { Hono } from "hono";

import { type AppEnv } from "../types/env.js";
import { db } from "../lib/db.js";

import { Nav } from "../components/nav.js";
import { Layout } from "../components/layout.js";
import { FileUploader } from "../components/file-uploader.js";
import { FilePrintSettings } from "../components/file-print-settings.js";
import { AdminOrders } from "../components/admin-orders.js";

export const home = new Hono<AppEnv>();

home.get("/", (c) => {
  const user = c.get("user");

  if (user && user.userId === 1) {
    const rows = db
      .prepare(
        `
SELECT
  orders.id AS orderId,
  orders.status,
  orders.created_at AS createdAt,
  files.id AS fileId,
  files.original_name AS filename,
  files.internal_name,
  files.num_pages AS numPages
FROM orders
LEFT JOIN files ON files.order_id = orders.id
ORDER BY orders.created_at DESC, files.id;
    `,
      )
      .all();

    // const rows = db.prepare(sql).all(userId);

    const orders = Object.values(
      Object.groupBy(rows, (row) => row.orderId),
    ).map((rows) => {
      const first = rows[0];

      return {
        id: first.orderId,
        status: first.status,
        createdAt: first.createdAt,
        files: rows
          .filter((row) => row.fileId !== null)
          .map((row) => ({
            id: row.fileId,
            filename: row.filename,
            internal_name: row.internal_name,
            numPages: row.numPages,
          })),
      };
    });

    return c.html(
      <Layout>
        <Nav
          links={[
            { name: user.username, href: "#" },
            { name: "log out", href: "/logout" },
          ]}
        />

        <AdminOrders orders={orders} />
      </Layout>,
    );
  }

  if (user) {
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

          <form
            id="checkout-form"
            fx-action="/checkout"
            fx-method="post"
            ext-fx-disable
            style={{ display: files.length > 0 ? "block" : "none" }}
          >
            <input type="hidden" name="userId" value={c.get("user").userId} />
            <button id="checkout-btn" type="submit" ext-fx-disable-target>
              Checkout
            </button>
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
