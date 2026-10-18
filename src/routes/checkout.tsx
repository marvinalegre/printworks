import { Hono } from "hono";

import { type AppEnv } from "@/types/env.js";
import { db } from "@/lib/db.js";

export const checkout = new Hono<AppEnv>();

checkout.post("/", async (c) => {
  const body = await c.req.parseBody();

  db.prepare(
    `
    UPDATE orders
    SET status = 'queued'
    WHERE status = 'new'
      AND user_id = ?
`,
  ).run(body.userId);

  return c.newResponse(null, 200, {
    "FX-Redirect": "/myaccount",
  });
});
