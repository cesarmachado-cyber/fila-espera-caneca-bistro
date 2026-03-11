import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = normalize(join(__filename, '..', '..'));
const rootDir = normalize(join(__dirname));
const publicDir = normalize(join(rootDir, 'src'));
const host = process.env.HOST ?? '0.0.0.0';
const port = Number(process.env.PORT ?? 5173);

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

const server = createServer(async (req, res) => {
  const urlPath = (req.url ?? '/').split('?')[0];

  if (urlPath === '/app-config.js') {
    const config = {
      supabaseUrl: process.env.SUPABASE_URL ?? '',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? '',
    };

    res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
    res.end(`window.__APP_CONFIG__ = ${JSON.stringify(config)};`);
    return;
  }

  const cleanPath = urlPath === '/' ? '/index.html' : urlPath;
  const filePath = normalize(join(publicDir, cleanPath));

  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  try {
    const data = await readFile(filePath);
    const ext = extname(filePath);
    res.writeHead(200, {
      'Content-Type': contentTypes[ext] ?? 'application/octet-stream',
    });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
  }
});

server.listen(port, host, () => {
  console.log(`Dev server disponível em http://${host}:${port}`);
});
