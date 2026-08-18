import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = __dirname;

// Render provides PORT automatically.
// Locally it will use 3000.
const PORT = process.env.PORT || 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.gif': 'image/gif'
};

function handler(req, res) {
  let urlPath = req.url.split('?')[0];

  // Home page
  if (urlPath === '/') {
    urlPath = '/index.html';
  }

  // Prevent access outside the project folder
  const filePath = path.resolve(ROOT, '.' + urlPath);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.error('File not found:', filePath);

      res.writeHead(404, {
        'Content-Type': 'text/plain; charset=utf-8'
      });

      res.end('Not found');
      return;
    }

    res.writeHead(200, {
      'Content-Type': contentType
    });

    res.end(data);
  });
}

const server = http.createServer(handler);

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('=================================');
  console.log('       ReelMind is running!');
  console.log('=================================');
  console.log(`Port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
});
