import { Hono } from "hono";

import { type AppEnv } from "../types/env.js";

import { Nav } from "../components/nav.js";
import { Layout } from "../components/layout.js";

export const home = new Hono<AppEnv>();

home.get("/", (c) => {
  const user = c.get("user");

  if (user) {
    return c.html(
      <Layout js={["upload.js"]}>
        <Nav
          links={[
            { name: user.username, href: "#" },
            { name: "log out", href: "/logout" },
          ]}
        />

        <main class="container">
          <article id="file-uploader">
            <header>
              <strong>Upload a file</strong>
            </header>

            <form id="uploadForm">
              <label for="fileInput">
                Choose file
                <input
                  type="file"
                  id="fileInput"
                  name="file"
                  accept="application/pdf,.pdf"
                />
              </label>

              <button type="submit" id="upload">
                Upload
              </button>
            </form>

            <progress id="progress" value="0" max="100" hidden></progress>
            <p id="status"></p>
          </article>

          <div id="result" class="mt-4"></div>
        </main>
      </Layout>,
    );
  }

  return c.html(
    <Layout>
      <Nav links={[{ name: "log in", href: "/login" }]} />
    </Layout>,
  );
});
