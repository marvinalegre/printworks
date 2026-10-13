import type { Context, Next } from "hono";

const ALLOWED_USER_ID = 1;

export const requireUserOne = async (c: Context, next: Next) => {
  const user = c.get("user");

  if (!user) {
    return c.text("Unauthorized", 401);
  }

  if (user.userId !== ALLOWED_USER_ID) {
    return c.text("Forbidden", 403);
  }

  await next();
};
