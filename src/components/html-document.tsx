import { html } from "hono/html";
import { type Child } from "hono/jsx";

interface Props {
  children: Child;
}

export const HtmlDocument = ({ children }: Props) => {
  return html`<!doctype html>${children}`;
};
