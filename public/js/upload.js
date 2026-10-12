const form = document.getElementById("uploadForm");
const input = document.getElementById("fileInput");
const btn = document.getElementById("upload");
const progress = document.getElementById("progress");
const statusEl = document.getElementById("status");
const settings = document.getElementById("settings");

input.addEventListener("change", () => {
  statusEl.textContent = "";
});

form.addEventListener("submit", (e) => {
  e.preventDefault();

  if (!input.files.length) {
    statusEl.textContent = "Please choose a file first.";
    return;
  }

  const formData = new FormData();
  formData.append("file", input.files[0]);

  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/upload");

  input.disabled = true;
  btn.disabled = true;
  btn.setAttribute("aria-busy", "true");
  progress.hidden = false;
  progress.value = 0;

  // Bytes sent from the browser
  xhr.upload.onprogress = (event) => {
    if (event.lengthComputable) {
      progress.value = Math.round((event.loaded / event.total) * 100);
    }
  };

  // Upload finished; server is now writing the file
  xhr.upload.onload = () => {
    progress.removeAttribute("value"); // indeterminate bar while the server responds
  };

  xhr.onload = () => {
    let data = {};
    try {
      data = JSON.parse(xhr.responseText);
    } catch {
      // Non-JSON response (e.g. an error page)
    }

    if (xhr.status >= 200 && xhr.status < 300) {
      statusEl.textContent = `Uploaded ${data.filename}`;
      renderFilePrintSettings(data);
    } else {
      statusEl.textContent = data.error ?? `Upload failed (${xhr.status})`;
    }
  };

  xhr.onerror = () => {
    statusEl.textContent = "Network error. Upload failed.";
  };

  xhr.onloadend = () => {
    input.disabled = false;
    btn.disabled = false;
    btn.removeAttribute("aria-busy");
    progress.hidden = true;
    form.reset();
  };

  xhr.send(formData);
});

async function sha256Hex(file) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(hashBuffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const COLOR_ROWS = [
  {
    key: "Full color",
    count: "numFullColorPages",
    ranges: "fullColorRanges",
    dotClass: "file-card__dot--full",
  },
  {
    key: "Mid color",
    count: "numMidColorPages",
    ranges: "midColorRanges",
    dotClass: "file-card__dot--mid",
  },
  {
    key: "Spot color",
    count: "numSpotColorPages",
    ranges: "spotColorRanges",
    dotClass: "file-card__dot--spot",
  },
];

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function svgIcon(paths, className) {
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("xmlns", NS);
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("class", className);
  for (const d of paths) {
    const path = document.createElementNS(NS, "path");
    path.setAttribute("d", d);
    svg.appendChild(path);
  }
  return svg;
}

const FILE_ICON_PATHS = [
  "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",
  "M14 2v4a2 2 0 0 0 2 2h4",
];

const LAYERS_ICON_PATHS = [
  "m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z",
  "m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65",
  "m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65",
];

function renderFileCard(data, container) {
  const {
    filename,
    numPages,
    pageSize,
    numFullColorPages,
    numMidColorPages,
    numSpotColorPages,
  } = data;

  const card = el("div", "file-card");

  // Header
  const header = el("div", "file-card__header");
  const iconWrap = el("div", "file-card__icon-wrap");
  iconWrap.appendChild(svgIcon(FILE_ICON_PATHS, "file-card__icon"));

  const titleBlock = el("div", "file-card__title-block");
  const title = el("h3", "file-card__title", filename);
  title.title = filename;
  const meta = el(
    "p",
    "file-card__meta",
    `${numPages} ${numPages === 1 ? "page" : "pages"} · ${pageSize}`,
  );
  titleBlock.append(title, meta);
  header.append(iconWrap, titleBlock);

  // Color rows
  const rows = el("div", "file-card__rows");
  for (const row of COLOR_ROWS) {
    const count = data[row.count];
    const ranges = data[row.ranges];

    const line = el("div", "file-card__row");
    const left = el("div", "file-card__row-left");
    left.append(
      el("span", `file-card__dot ${row.dotClass}`),
      el("span", "file-card__label", row.key),
    );

    const right = el("div", "file-card__row-right");
    right.appendChild(el("span", "file-card__count", String(count)));
    if (ranges) {
      right.appendChild(el("p", "file-card__ranges", ranges));
    }

    line.append(left, right);
    rows.appendChild(line);
  }

  // Footer
  const classified = numFullColorPages + numMidColorPages + numSpotColorPages;
  const footer = el("div", "file-card__footer");
  footer.append(
    svgIcon(LAYERS_ICON_PATHS, "file-card__icon--small"),
    el("span", null, `${classified} of ${numPages} pages classified`),
  );

  card.append(header, rows, footer);
  container.replaceChildren(card);
}

function renderFilePrintSettings({ filename }) {
  if (!settings) return;

  const article = document.createElement("article");
  article.textContent = filename;

  settings.prepend(article);
}
