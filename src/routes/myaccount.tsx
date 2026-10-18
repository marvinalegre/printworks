import { Hono } from "hono";

import { type AppEnv } from "@/types/env.js";
import { db } from "@/lib/db.js";

import { Nav } from "@/components/nav.js";
import { Layout } from "@/components/layout.js";
import { Orders } from "@/components/orders.js";

export const myaccount = new Hono<AppEnv>();

myaccount.get("/", (c) => {
  const user = c.get("user");

  const rows = db
    .prepare(
      `
SELECT
  orders.id AS orderId,
  orders.status,
  orders.created_at AS createdAt,
  files.id AS fileId,
  files.original_name AS filename,
  files.num_pages AS numPages
FROM orders
LEFT JOIN files ON files.order_id = orders.id
WHERE orders.user_id = ?
ORDER BY orders.created_at DESC, files.id;
    `,
    )
    .all(c.get("user").userId);

  // const rows = db.prepare(sql).all(userId);

  const orders = Object.values(Object.groupBy(rows, (row) => row.orderId)).map(
    (rows) => {
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
            numPages: row.numPages,
          })),
      };
    },
  );

  return c.html(
    <Layout>
      <Nav
        links={[
          { name: user.username, href: "#" },
          { name: "log out", href: "/logout" },
        ]}
      />

      <Orders orders={orders} />
    </Layout>,
  );
});
