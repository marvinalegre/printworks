interface Props {
  values?: {
    username?: string;
  };
  formError?: string;
}

export const LoginForm = ({ values = {}, formError }: Props) => {
  return (
    <div id="login-form">
      {formError && <p id="form-error">{formError}</p>}

      <form
        fx-action="/login"
        fx-method="post"
        fx-target="#login-form"
        fx-swap="outerHTML"
        ext-fx-disable
      >
        <label for="username">Username</label>
        <input
          id="username"
          type="text"
          name="username"
          value={values.username ?? ""}
          ext-fx-disable-target
        />

        <label for="password">Password</label>
        <input
          id="password"
          type="password"
          name="password"
          ext-fx-disable-target
        />

        <label id="show-password-label">
          <input type="checkbox" id="show-password" />
          Show password
        </label>

        <button type="submit" ext-fx-disable-target>
          Log in
        </button>
      </form>
    </div>
  );
};
