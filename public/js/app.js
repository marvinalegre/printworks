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
