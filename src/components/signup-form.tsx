interface Props {
  values?: {
    username?: string;
  };
  fieldErrors?: {
    username?: string[];
    password?: string[];
  };
  formError?: string;
}

export const SignupForm = ({
  values = {},
  fieldErrors = {},
  formError,
}: Props) => {
  return (
    <div id="signup-form">
      {formError && <p id="form-error">{formError}</p>}

      <form
        fx-action="/signup"
        fx-method="post"
        fx-target="#signup-form"
        fx-swap="outerHTML"
        ext-fx-disable
      >
        <label for="username">Username</label>
        <input
          id="username"
          type="text"
          name="username"
          value={values.username ?? ""}
          aria-invalid={fieldErrors.username ? "true" : ""}
          aria-describedby="username-error"
          ext-fx-disable-target
        />
        {fieldErrors.username ? (
          <small id="username-error">{fieldErrors.username[0]}</small>
        ) : null}

        <label for="password">Password</label>
        <input
          id="password"
          type="password"
          name="password"
          aria-invalid={fieldErrors.password ? "true" : ""}
          aria-describedby="password-error"
          ext-fx-disable-target
        />
        {fieldErrors.password ? (
          <small id="password-error">{fieldErrors.password[0]}</small>
        ) : null}

        <label id="show-password-label">
          <input type="checkbox" id="show-password" />
          Show password
        </label>

        <button type="submit" ext-fx-disable-target>
          Sign up
        </button>
      </form>
    </div>
  );
};
