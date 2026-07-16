/**
 * Production static server for the real Expo web export.
 *
 * Serves `dist/` (output of `expo export -p web`) as a single-page app:
 * any request for a path that isn't an actual file on disk falls back to
 * index.html so client-side routes (e.g. /reset-password, /auth/callback)
 * resolve correctly on a hard refresh or direct link, not just in-app nav.
 *
 * Zero external dependencies -- uses only Node.js built-ins.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const DIST_ROOT = path.resolve(__dirname, '..', 'dist');
const INDEX_HTML = path.join(DIST_ROOT, 'index.html');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.map': 'application/json',
};

// Hashed static assets can be cached forever; index.html must always
// be revalidated so deploys are picked up immediately.
function cacheHeaderFor(filePath) {
  if (path.basename(filePath) === 'index.html') {
    return 'no-cache';
  }
  return 'public, max-age=31536000, immutable';
}

function sendFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const content = fs.readFileSync(filePath);
  res.writeHead(200, {
    'content-type': contentType,
    'cache-control': cacheHeaderFor(filePath),
  });
  res.end(content);
}

if (!fs.existsSync(DIST_ROOT) || !fs.existsSync(INDEX_HTML)) {
  console.error(
    `Build output not found at ${DIST_ROOT}. Run "pnpm run build:web" first.`,
  );
  process.exit(1);
}

const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const safePath = path
      .normalize(decodeURIComponent(url.pathname))
      .replace(/^(\.\.(\/|\\|$))+/, '');
    const filePath = path.join(DIST_ROOT, safePath);

    if (!filePath.startsWith(DIST_ROOT)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return sendFile(filePath, res);
    }

    // SPA fallback: unknown paths (client-side routes) get index.html.
    return sendFile(INDEX_HTML, res);
  } catch (err) {
    res.writeHead(500);
    res.end('Internal Server Error');
    console.error(err);
  }
});

const port = parseInt(process.env.PORT || '3000', 10);
server.listen(port, '0.0.0.0', () => {
  console.log(`Serving ChamaYetu web build on port ${port}`);
});
