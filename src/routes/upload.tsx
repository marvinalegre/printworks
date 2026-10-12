import { Hono } from "hono";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { type AppEnv } from "../types/env.js";

export const upload = new Hono<AppEnv>();

upload.post("/", async (c) => {
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

  return c.json({ name: safeName });
});
