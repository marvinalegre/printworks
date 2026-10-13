import { type Child } from "hono/jsx";

import { HtmlDocument } from "./html-document.js";

interface Props {
  js?: string[];
  children: Child;
}

export const Layout = ({ js = [], children }: Props) => {
  return (
    <HtmlDocument>
      <html lang="en" data-theme="dark">
        <head>
          <meta charSet="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <title>Printworks</title>

          <link rel="stylesheet" href="/public/vendor/pico.blue.min.css" />
          <link rel="stylesheet" href="/public/css/app.css" />

          <script defer src="/public/vendor/fixi-0.9.4.js"></script>
          <script defer src="/public/js/app.js"></script>
          {js.map((filename) => (
            <script defer src={`/public/js/${filename}`}></script>
          ))}
        </head>
        <body>{children}</body>
      </html>
    </HtmlDocument>
  );
};
