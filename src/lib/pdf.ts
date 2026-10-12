import { execFile } from "node:child_process";
import { mkdtemp, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";

export interface BWOptions {
  /** Max channel spread allowed for a pixel to count as neutral (0–255). */
  tolerance?: number;
  /** Downscale wide images to this width before sampling. */
  maxWidth?: number;
}

/**
 * A pixel is neutral if its channels are all within `tolerance` of each other.
 * This covers pure gray, near-black, and near-white in one check.
 */
function isNeutral(
  r: number,
  g: number,
  b: number,
  tolerance: number,
): boolean {
  return Math.max(r, g, b) - Math.min(r, g, b) <= tolerance;
}

/**
 * Returns the percentage of pixels that are black, white, or gray (0–100, two decimals).
 */
export async function getBWPercentage(
  file: string | Buffer,
  { tolerance = 10, maxWidth = 1000 }: BWOptions = {},
): Promise<number> {
  const { data, info } = await sharp(file)
    .flatten({ background: "#ffffff" }) // composite transparency onto white
    .toColourspace("srgb") // normalize grayscale/CMYK/etc. to RGB
    .resize({ width: maxWidth, withoutEnlargement: true })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const total = width * height;
  if (total === 0) return 0;

  let neutral = 0;
  for (let i = 0; i < data.length; i += channels) {
    if (isNeutral(data[i], data[i + 1], data[i + 2], tolerance)) neutral++;
  }

  return Math.round((neutral / total) * 10000) / 10000;
}

const RENDER_DPI = 10;
const TIMEOUT_MS = 30_000;

export async function pdfToImages(pdfPath: string): Promise<string[]> {
  const outDir = await mkdtemp(path.join(tmpdir(), "pdf-"));
  const prefix = path.join(outDir, "page");

  await new Promise<void>((resolve, reject) => {
    execFile(
      "pdftoppm",
      ["-r", String(RENDER_DPI), "-jpeg", pdfPath, prefix],
      { timeout: TIMEOUT_MS },
      (err, _stdout, stderr) => {
        if (err) {
          reject(
            new Error(`pdftoppm failed: ${stderr || err.message}`, {
              cause: err,
            }),
          );
          return;
        }
        resolve();
      },
    );
  });

  const files = await readdir(outDir);
  return files
    .filter((f) => f.endsWith(".jpg"))
    .map((f) => path.join(outDir, f));
}

const execFileAsync = promisify(execFile);

export interface PdfInfo {
  numPages?: number;
  width?: number;
  height?: number;
  size?: number;
}

export async function getPdfInfo(pdfPath: string): Promise<PdfInfo> {
  let stdout: string;

  try {
    // execFile passes args directly, so paths with quotes or spaces are safe
    ({ stdout } = await execFileAsync("pdfinfo", [pdfPath], {
      timeout: 10_000,
      maxBuffer: 1024 * 1024,
    }));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Error executing pdfinfo: ${message}`);
  }

  const info: PdfInfo = {};

  const pageSize = stdout.match(
    /Page size:\s*(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/,
  );
  if (pageSize) {
    info.width = parseFloat(pageSize[1]);
    info.height = parseFloat(pageSize[2]);
  }

  const pages = stdout.match(/^Pages:\s*(\d+)/m);
  if (pages) {
    info.numPages = parseInt(pages[1], 10);
  }

  // "File size" is reported in bytes, e.g. "File size: 123456 bytes"
  const fileSize = stdout.match(/^File size:\s*(\d+)/m);
  if (fileSize) {
    info.size = parseInt(fileSize[1], 10);
  }

  return info;
}
