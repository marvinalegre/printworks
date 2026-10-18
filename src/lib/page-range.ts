export function isValidPageRange(range: string, numPages: number) {
  // Trim leading and trailing spaces and split by commas
  const parts = range.trim().split(",");

  // Check for leading or trailing commas (empty first or last part)
  if (parts[0] === "" || parts[parts.length - 1] === "") {
    return false; // Invalid if the first or last part is empty (indicating a leading or trailing comma)
  }

  // Validate each part (either a single page or a range)
  for (let part of parts) {
    part = part.trim(); // Remove any extra spaces around each part

    if (part.includes("-")) {
      // It's a range (start-end)
      const [start, end] = part.split("-");

      // Validate that both start and end are numbers and start <= end
      if (!isValidSingleRange(Number(start), Number(end), numPages)) {
        return false; // Invalid range
      }
    } else {
      // It's a single page, validate it's a positive integer
      if (!/^\d+$/.test(part)) {
        return false; // Invalid single page
      }

      if (Number(part) > numPages) return false;

      // Also check if page number is zero or negative, which is invalid
      const pageNum = Number(part);
      if (pageNum <= 0) {
        return false; // Invalid page number (must be positive)
      }
    }
  }

  return true; // All parts are valid
}

function isValidSingleRange(
  start: number,
  end: number,
  numPages: number,
): boolean {
  if (
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    !Number.isInteger(numPages)
  ) {
    return false;
  }
  if (numPages < 1) return false;
  if (end > numPages) return false;

  return start >= 1 && start <= end;
}

export function countPages(range: string) {
  // Split the input string by commas
  const parts = range.split(",");

  const pages = new Set(); // Use a Set to track unique pages

  // Loop through each part and process accordingly
  parts.forEach((part) => {
    if (part.includes("-")) {
      // If the part is a range (e.g., '6-11')
      const [start, end] = part.split("-").map(Number);
      for (let i = start; i <= end; i++) {
        pages.add(i); // Add each page in the range to the Set
      }
    } else {
      // If it's a single page (e.g., '1')
      pages.add(Number(part)); // Add the page number to the Set
    }
  });

  // The size of the Set represents the number of unique pages
  return pages.size;
}

export function arrayToRangeString(arr: number[]) {
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
