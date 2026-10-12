document.getElementById("upload").addEventListener("click", async () => {
  const input = document.getElementById("fileInput");
  const formData = new FormData();
  formData.append("file", input.files[0]);

  const res = await fetch("/upload", {
    method: "POST",
    body: formData,
  });
  console.log(await res.json());
});
