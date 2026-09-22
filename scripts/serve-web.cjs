const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../dist');
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.ttf': 'font/ttf',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};
http
  .createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const requested = path.resolve(root, '.' + pathname);
    if (!requested.startsWith(root + path.sep) && requested !== root) {
      res.writeHead(403);
      res.end();
      return;
    }
    const file =
      fs.existsSync(requested) && fs.statSync(requested).isFile()
        ? requested
        : path.join(root, 'index.html');
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  })
  .listen(4173, '127.0.0.1', () => console.log('Prototype preview: http://127.0.0.1:4173'));
