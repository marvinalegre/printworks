import formidable from "formidable";
import { exec } from "node:child_process";
import fs from "fs";
import sharp from "sharp";
import db from "../db/db.js";

export async function removeFile(req, res) {
  const { filename, orderRefNumber } = req.body;

  const { order_id } = db
    .prepare(
      `
      SELECT order_id FROM orders where order_reference_number = ?
      `,
    )
    .get(orderRefNumber);

  db.prepare(
    `
    DELETE FROM files
    WHERE order_id = ? AND file_name = ?
    `,
  ).run(order_id, filename);

  res.status(200).end();
}

export async function handleUpload(req, res) {
  try {
    var {
      fields: {
        orderRefNumber: [orderRefNumber],
      },
      files: { files },
    } = await parseForm(req);
  } catch (e) {
    return res.status(500).end();
  }

  await Promise.all(
    files.map((f) =>
      (async () => {
        const { originalFilename, newFilename, size } = f;
        const numPages = await getPdfPageCount(f.filepath);

        await pdfToImage(f.filepath, newFilename);

        const fullColorPages = [];
        const midColorPages = [];
        const spotColorPages = [];
        for (let i = 1; i <= numPages; i++) {
          const percentage = await getBWPercentage(
            `${f.filepath}-${
              numPages < 10
                ? i
                : i.toString().padStart(numPages.toString().length, "0")
            }.jpg`,
          );
          if (percentage < 0.33) {
            fullColorPages.push(i);
          } else if (percentage < 0.66) {
            midColorPages.push(i);
          } else if (percentage <= 1) {
            spotColorPages.push(i);
          }
        }

        exec(`rm ${f.filepath}-*`);

        const [width, length] = await getPdfPageSize(`${f.filepath}`);
        let paperSizeName;
        if (594 < width && width < 597 && 840 < length && length < 843) {
          paperSizeName = "a";
        } else if (611 < width && width < 614 && 934 < length && length < 937) {
          paperSizeName = "l";
        } else if (611 < width && width < 614 && 791 < length && length < 793) {
          paperSizeName = "s";
        } else {
          paperSizeName = "s";
        }

        const { order_id } = db
          .prepare(
            `
            SELECT order_id FROM orders where order_reference_number = ?
            `,
          )
          .get(orderRefNumber);

        db.prepare(
          "insert into files (order_id, file_name, internal_name, md5_hash, file_size, num_pages, full_color_pages, mid_color_pages, spot_color_pages, paper_size) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        ).run(
          order_id,
          originalFilename,
          newFilename,
          f.hash,
          size,
          numPages,
          arrayToRangeString(fullColorPages),
          arrayToRangeString(midColorPages),
          arrayToRangeString(spotColorPages),
          paperSizeName,
        );

        return {
          originalFilename,
          numPages,
          size,
          fullColorPages,
          midColorPages,
          spotColorPages,
          paperSizeName,
        };
      })(),
    ),
  );

  res.status(201).end();
}

function parseForm(req) {
  const form = formidable({
    uploadDir: process.env.UPLOAD_DIR,
    hashAlgorithm: "md5",
    maxFiles: 10,
  });

  if (!fs.existsSync(form.uploadDir)) {
    fs.mkdirSync(form.uploadDir);
  }

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

// Function to get the number of pages in a PDF
async function getPdfPageCount(pdfPath) {
  try {
    // Run the pdfinfo command and wrap it in a Promise
    const pageCount = await new Promise((resolve, reject) => {
      exec(`pdfinfo "${pdfPath}"`, (error, stdout, stderr) => {
        if (error) {
          reject(`Error executing pdfinfo: ${error.message}`);
          return;
        }
        if (stderr) {
          reject(`Error: ${stderr}`);
          return;
        }

        // Extract the number of pages from the output
        const pageCountMatch = stdout.match(/Pages:\s*(\d+)/);
        if (pageCountMatch) {
          resolve(parseInt(pageCountMatch[1], 10)); // Resolve with the page count
        } else {
          reject("Could not extract page count from pdfinfo output");
        }
      });
    });

    return pageCount;
  } catch (error) {
    console.error("Error:", error);
    return null; // Return null if there's an error
  }
}

function pdfToImage(file) {
  return new Promise((resolve, reject) => {
    exec(
      // 10 DPI
      `pdftoppm -r 10 -jpeg ${file} ${file}`,
      (err, stdout, stderr) => {
        if (err) {
          reject(err);
          return;
        }
        if (stderr) {
          if (/Bad block header in flate stream/.test(stderr)) {
            resolve();
            return;
          }
          reject(stderr);
          return;
        } else {
          resolve(stdout);
        }
      },
    );
  });
}

async function getBWPercentage(file) {
  const pixels = await getRGBMapping(file);

  let grayCount = 0;
  for (const pixel of pixels) {
    if (isBlackWhiteOrGray(...pixel)) grayCount++;
  }

  return Math.round((grayCount / pixels.length) * 100) / 100;
}

function isBlackWhiteOrGray(r, g, b, tolerance = 10) {
  // Check if the color is close to black (within tolerance)
  if (r <= tolerance && g <= tolerance && b <= tolerance) {
    return true;
  }

  // Check if the color is close to white (within tolerance)
  if (r >= 255 - tolerance && g >= 255 - tolerance && b >= 255 - tolerance) {
    return true;
  }

  // Check if the color is gray within a given tolerance (R = G = B)
  if (
    Math.abs(r - g) < tolerance &&
    Math.abs(g - b) < tolerance &&
    Math.abs(r - b) < tolerance
  ) {
    return true;
  }

  // If it's none of the above, it's not black, white, or gray
  return false;
}

function getRGBMapping(filePath) {
  return new Promise((resolve, reject) => {
    sharp(filePath)
      .raw() // Get the raw pixel data (no color conversion)
      .toBuffer((err, data, info) => {
        if (err) {
          return reject(err); // Reject if an error occurs
        }

        const { width, height } = info; // Get the image dimensions
        const rgbData = [];

        // Iterate through the raw pixel data and map to RGB
        for (let i = 0; i < data.length; i += 3) {
          const r = data[i]; // Red channel
          const g = data[i + 1]; // Green channel
          const b = data[i + 2]; // Blue channel

          rgbData.push([r, g, b]); // Push the RGB values into the array
        }

        resolve(rgbData); // Return the full RGB data
      });
  });
}

function getPdfPageSize(filename) {
  return new Promise((resolve, reject) => {
    // Run the pdfinfo command to get PDF metadata
    exec(`pdfinfo "${filename}"`, (error, stdout, stderr) => {
      if (error || stderr) {
        reject(`Error executing pdfinfo: ${error || stderr}`);
        return;
      }

      // Extract page size from the output
      const pageSizeMatch = stdout.match(
        /Page size:\s*(\d+(\.\d+)?)\s*x\s*(\d+(\.\d+)?)/,
      );
      if (pageSizeMatch) {
        const width = parseFloat(pageSizeMatch[1]); // Capture width (supports integer and decimal)
        const height = parseFloat(pageSizeMatch[3]); // Capture height (supports int
        resolve([width, height]);
      } else {
        reject("Could not extract page size from PDF.");
      }
    });
  });
}

function arrayToRangeString(arr) {
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
