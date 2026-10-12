document.body.addEventListener("input", (e) => {
  if (document.querySelector("#username") == e.target) {
    e.target.setAttribute("aria-invalid", "");
    document.querySelector("#username-error")?.remove();
    document.querySelector("#form-error")?.remove();
  }

  if (document.querySelector("#password") == e.target) {
    e.target.setAttribute("aria-invalid", "");
    document.querySelector("#password-error")?.remove();
    document.querySelector("#form-error")?.remove();
  }
});

document.querySelector("#show-password").addEventListener("change", (e) => {
  document.querySelector("#password").type = e.target.checked
    ? "text"
    : "password";
});
