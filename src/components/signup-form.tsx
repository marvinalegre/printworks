export const SignupForm = () => {
  return (
    <form id="signup-form" method="post" action="/signup">
      <label for="username">Username</label>
      <input id="username" type="text" name="username" />

      <label for="password">Password</label>
      <input id="password" type="password" name="password" />
      <label id="show-password-label">
        <input type="checkbox" id="show-password" />
        Show password
      </label>

      <button type="submit">Sign up</button>
    </form>
  );
};
