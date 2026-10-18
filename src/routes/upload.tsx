import { Hono } from "hono";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { createHash } from "node:crypto";

import { type AppEnv } from "@/types/env.js";
import { db } from "@/lib/db.js";
import { getPdfInfo, pdfToImages, getBWPercentage } from "@/lib/pdf.js";

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

  // TODO: clamscan

  let newOrder = db
    .prepare<[number], { id: number }>(
      `
      SELECT
        orders.id
      FROM
        orders
      WHERE
        status = 'new'
        AND orders.user_id = ?
      `,
    )
    .get(c.get("user").userId);

  if (!newOrder) {
    const createOrderResult = db
      .prepare(
        `
        INSERT INTO
          orders (user_id, order_reference_number)
        VALUES
          (?, ?)
        `,
      )
      .bind(c.get("user").userId, randomUUID())
      .run();

    newOrder = { id: Number(createOrderResult.lastInsertRowid) };
  }

  const { numPages, width, height, size } = await getPdfInfo(filePath);

  let images: string[];
  try {
    images = await pdfToImages(filePath);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (/Unknown character collection|Adobe-Identity-H/.test(message)) {
      throw new Error("Unknown character collection", { cause: e });
    }
    throw e;
  }

  const fullColorPages: number[] = [];
  const midColorPages: number[] = [];
  const spotColorPages: number[] = [];

  try {
    for (const [index, imagePath] of images.entries()) {
      const pageNumber = index + 1;
      const percentage = await getBWPercentage(imagePath);
      if (percentage < 0.33) {
        fullColorPages.push(pageNumber);
      } else if (percentage < 0.66) {
        midColorPages.push(pageNumber);
      } else if (percentage <= 1) {
        spotColorPages.push(pageNumber);
      }
    }
  } finally {
    if (images.length > 0) {
      await rm(path.dirname(images[0]), { recursive: true, force: true });
    }
  }

  let pageSize;
  if (!width || !height) {
    pageSize = "short";
  } else if (594 < width && width < 597 && 840 < height && height < 843) {
    pageSize = "a4";
  } else if (611 < width && width < 614 && 934 < height && height < 937) {
    pageSize = "long";
  } else if (611 < width && width < 614 && 791 < height && height < 793) {
    pageSize = "short";
  } else {
    // TODO: throw something?
    pageSize = "short";
  }

  const bytes = await readFile(filePath);
  const hash = sha256Hex(bytes);

  db.prepare(
    `
    INSERT INTO
      files (
        order_id,
        original_name,
        internal_name,
        sha256_hash,
        file_size,
        num_pages,
        page_size,
        full_color_pages,
        mid_color_pages,
        spot_color_pages
      )
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
  )
    .bind(
      newOrder.id,
      file.name,
      storedName,
      hash,
      size,
      numPages,
      pageSize,
      arrayToRangeString(fullColorPages),
      arrayToRangeString(midColorPages),
      arrayToRangeString(spotColorPages),
    )
    .run();

  return c.json({
    filename: file.name,
    numPages,
    pageSize,
    fullColorRanges: arrayToRangeString(fullColorPages),
    midColorRanges: arrayToRangeString(midColorPages),
    spotColorRanges: arrayToRangeString(spotColorPages),
    numFullColorPages: fullColorPages.length,
    numMidColorPages: midColorPages.length,
    numSpotColorPages: spotColorPages.length,
  });
});

function sha256Hex(bytes: Uint8Array | Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function arrayToRangeString(arr: number[]) {
  if (arr.length === 0) return null;

  const result = [];
  let rangeStart = arr[0];
  let rangeEnd = arr[0];

  for (let i = 1; i <= arr.length; i++) {
    if (arr[i] === rangeEnd + 1) {
      rangeEnd = arr[i];
    } else {
      if (rangeStart === rangeEnd) {
        result.push(`${rangeStart}`);
      } else {
        result.push(`${rangeStart}-${rangeEnd}`);
      }
      rangeStart = arr[i];
      rangeEnd = arr[i];
    }
  }

  return result.join(",");
}
