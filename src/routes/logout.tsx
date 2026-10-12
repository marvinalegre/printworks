import { Hono } from "hono";
import { getCookie, deleteCookie } from "hono/cookie";
import { removeSession } from "../lib/sessions.js";

export const logout = new Hono();

logout.post("/", (c) => {
  const sessionId = getCookie(c, "session");

  if (sessionId) {
    removeSession(sessionId);
  }

  deleteCookie(c, "session", { path: "/" });

  return c.newResponse(null, 200, {
    "FX-Redirect": "/login",
  });
});
