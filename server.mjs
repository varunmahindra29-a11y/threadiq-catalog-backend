import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = process.cwd();
const args = process.argv.slice(2);
const host = readArg("--host") || "127.0.0.1";
const port = Number(readArg("--port") || 4173);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

function readArg(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : "";
}

function resolvePath(url) {
  const pathname = new URL(url, `http://${host}:${port}`).pathname;
  if (pathname === "/") return join(root, "index.html");
  const safePath = normalize(decodeURIComponent(pathname))
    .replace(/^(\.\.[/\\])+/, "")
    .replace(/^[/\\]+/, "");
  return join(root, safePath);
}

const server = createServer(async (request, response) => {
  try {
    const filePath = resolvePath(request.url || "/");
    const body = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(body);
  } catch (error) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

server.listen(port, host, () => {
  console.log(`ThreadIQ running at http://${host}:${port}`);
});
