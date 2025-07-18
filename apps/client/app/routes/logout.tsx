import { redirect } from "react-router";

export async function clientAction() {
  await fetch("/api/auth/logout", {
    method: "POST",
  });
  return redirect("/login");
}
