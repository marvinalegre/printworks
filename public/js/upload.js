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

function renderFilePrintSettings({
  filename,
  numPages,
  pageSize,
  fullColorRanges,
  midColorRanges,
  spotColorRanges,
  numFullColorPages,
  numMidColorPages,
  numSpotColorPages,
}) {
  if (!settings) return;

  const article = document.createElement("article");
  article.className = "print-settings";

  article.innerHTML = `
    <div class="file-heading">
      <div class="file-icon" aria-hidden="true">PDF</div>
      <div class="file-heading-text">
        <span class="eyebrow">DOCUMENT DETAILS</span>
        <h2 class="file-name"></h2>
        <p class="file-meta"></p>
      </div>
    </div>

    <section class="settings-section">
      <div class="section-heading">
        <div>
          <span class="eyebrow">ANALYSIS</span>
          <h3>Color breakdown</h3>
        </div>
        <span class="page-total"></span>
      </div>

      <div class="color-breakdown">
        <div class="color-card full-color">
          <div class="color-card-top">
            <span class="color-dot"></span>
            <span>Full color</span>
          </div>
          <strong class="color-count"></strong>
          <span class="color-unit">pages</span>
          <div class="range-value"></div>
        </div>

        <div class="color-card mid-color">
          <div class="color-card-top">
            <span class="color-dot"></span>
            <span>Mid color</span>
          </div>
          <strong class="color-count"></strong>
          <span class="color-unit">pages</span>
          <div class="range-value"></div>
        </div>

        <div class="color-card spot-color">
          <div class="color-card-top">
            <span class="color-dot"></span>
            <span>Spot color</span>
          </div>
          <strong class="color-count"></strong>
          <span class="color-unit">pages</span>
          <div class="range-value"></div>
        </div>
      </div>
    </section>

    <section class="settings-section print-section">
      <div class="section-heading">
        <div>
          <span class="eyebrow">CONFIGURATION</span>
          <h3>Print settings</h3>
        </div>
      </div>

      <form class="print-form">
        <label>
          Page size
          <select name="pageSize">
            <option value="A4">A4</option>
            <option value="A3">A3</option>
            <option value="Letter">Letter</option>
            <option value="Legal">Legal</option>
          </select>
        </label>

        <label>
          Copies
          <input
            type="number"
            name="copies"
            min="1"
            max="999"
            value="1"
            required
          />
        </label>

        <label>
          Color mode
          <select name="colorMode">
            <option value="color">Color</option>
            <option value="grayscale">Grayscale</option>
            <option value="black">Black and white</option>
          </select>
        </label>

        <label>
          Orientation
          <select name="orientation">
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </label>

        <label class="pages-field">
          Pages to print
          <input
            type="text"
            name="pages"
            placeholder="All pages (e.g. 1-5, 8)"
          />
          <small>Leave empty to print every page.</small>
        </label>
      </form>
    </section>
  `;

  const setText = (selector, value) => {
    article.querySelector(selector).textContent = value;
  };

  setText(".file-name", filename);
  setText(".file-meta", `${numPages} pages · PDF document`);
  setText(".page-total", `${numPages} total pages`);

  const breakdowns = [
    [".full-color", numFullColorPages, fullColorRanges],
    [".mid-color", numMidColorPages, midColorRanges],
    [".spot-color", numSpotColorPages, spotColorRanges],
  ];

  for (const [selector, count, ranges] of breakdowns) {
    const card = article.querySelector(selector);
    card.querySelector(".color-count").textContent = count;
    card.querySelector(".range-value").textContent = ranges || "No pages";
  }

  article.querySelector('[name="pageSize"]').value = [
    ...article.querySelector('[name="pageSize"]').options,
  ].some((option) => option.value === pageSize)
    ? pageSize
    : "A4";

  settings.prepend(article);
}
