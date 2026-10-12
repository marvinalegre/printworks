const form = document.getElementById("uploadForm");
const input = document.getElementById("fileInput");
const btn = document.getElementById("upload");
const progress = document.getElementById("progress");
const statusEl = document.getElementById("status");

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
      statusEl.textContent = `Uploaded ${data.name}`;
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
    fileName.textContent = "No file selected";
  };

  xhr.send(formData);
});
