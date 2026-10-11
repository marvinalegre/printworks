document.body.addEventListener("fx:after", (evt) => {
  const redirect = evt.detail.cfg.response.headers.get("FX-Redirect");
  if (redirect) {
    window.location.href = redirect;
  }
});

// fixi disable elements extension
document.addEventListener("fx:init", (evt) => {
  if (evt.target.matches("[ext-fx-disable]")) {
    evt.target.addEventListener("fx:before", () => {
      const disableTargets = document.querySelectorAll(
        "[ext-fx-disable-target]",
      );
      disableTargets.forEach((target) => {
        target.disabled = true;
      });
      evt.target.addEventListener("fx:after", (afterEvt) => {
        if (afterEvt.target == evt.target) {
          disableTargets.forEach((target) => {
            target.disabled = false;
          });
        }
      });
    });
  }
});

document.body.addEventListener("input", (e) => {
  if (document.querySelector("#username") == e.target) {
    e.target.setAttribute("aria-invalid", "");
    document.querySelector("#username-error")?.remove();
  }

  if (document.querySelector("#password") == e.target) {
    e.target.setAttribute("aria-invalid", "");
    document.querySelector("#password-error")?.remove();
  }
});

document.querySelector("#show-password").addEventListener("change", (e) => {
  document.querySelector("#password").type = e.target.checked
    ? "text"
    : "password";
});
