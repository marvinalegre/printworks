document.querySelector("#show-password").addEventListener("change", (e) => {
  document.querySelector("#password").type = e.target.checked
    ? "text"
    : "password";
});
