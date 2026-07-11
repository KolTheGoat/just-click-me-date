import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");

function jsString(value) {
  return JSON.stringify(value);
}

await rm(dist, { recursive: true, force: true });
await mkdir(path.join(dist, "server"), { recursive: true });
await mkdir(path.join(dist, ".openai"), { recursive: true });

const html = await readFile(path.join(root, "index.html"), "utf8");
const css = await readFile(path.join(root, "styles.css"), "utf8");
const script = await readFile(path.join(root, "script.js"), "utf8");
const image = await readFile(path.join(root, "assets", "date-bg.png"));
const hosting = await readFile(path.join(root, ".openai", "hosting.json"), "utf8");

const bundledHtml = html
  .replace('<link rel="stylesheet" href="/styles.css" />', `<style>${css}</style>`)
  .replace('<script type="module" src="/script.js"></script>', `<script type="module">${script}</script>`);

const server = `
const html = ${jsString(bundledHtml)};
const imageBase64 = ${jsString(image.toString("base64"))};

function decodeBase64(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/assets/date-bg.png") {
      return new Response(decodeBase64(imageBase64), {
        headers: {
          "content-type": "image/png",
          "cache-control": "public, max-age=31536000, immutable"
        }
      });
    }

    return new Response(html, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store"
      }
    });
  }
};
`;

await writeFile(path.join(dist, "server", "index.js"), server.trimStart());
await writeFile(path.join(dist, ".openai", "hosting.json"), hosting);
