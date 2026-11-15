// Pinned Playwright Chromium/file URLs remain the default. Managed environments
// may explicitly select a system browser and loopback HTTP instead.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
let origin;
exports.gameURL = () => origin ? origin + '/index.html' : 'file://' + path.resolve(__dirname, '../index.html');
exports.chromium = {
  async launch(options = {}) {
    let server;
    if (process.env.LAST_LIGHT_HTTP === '1') {
      const root = path.resolve(__dirname, '..');
      server = http.createServer((req, res) => {
        let name;
        try { name = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname)); }
        catch { res.writeHead(400).end(); return; }
        if (!name.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
        const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };
        fs.readFile(name, (err, data) => {
          if (err) { res.writeHead(404).end(); return; }
          res.setHeader('Content-Type', types[path.extname(name)] || 'application/octet-stream');
          res.end(data);
        });
      });
      await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
      origin = 'http://127.0.0.1:' + server.address().port;
      server.unref();
    }
    try {
      const executablePath = process.env.LAST_LIGHT_CHROMIUM;
      const browser = await chromium.launch({ ...options, ...(executablePath ? { executablePath } : {}) });
      browser.on('disconnected', () => { if (server) server.close(); });
      return browser;
    } catch (err) { if (server) server.close(); throw err; }
  }
};
