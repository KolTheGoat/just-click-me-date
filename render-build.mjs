import { copyFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const out = path.join(root, "render-dist");

await rm(out, { recursive: true, force: true });
await mkdir(path.join(out, "assets"), { recursive: true });

await copyFile(path.join(root, "index.html"), path.join(out, "index.html"));
await copyFile(path.join(root, "styles.css"), path.join(out, "styles.css"));
await copyFile(path.join(root, "script.js"), path.join(out, "script.js"));
await copyFile(path.join(root, "assets", "date-bg.png"), path.join(out, "assets", "date-bg.png"));
