import { handler } from './dist/server/entry.mjs';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Serve static files from the client dist folder
app.use('/_astro', express.static(join(__dirname, 'dist/client/_astro')));
app.use('/favicon.ico', express.static(join(__dirname, 'public/favicon.ico')));
app.use('/manifest.json', express.static(join(__dirname, 'public/manifest.json')));
app.use('/robots.txt', express.static(join(__dirname, 'public/robots.txt')));
app.use(express.static(join(__dirname, 'public')));

// Use Astro's request handler for all other routes
app.use(handler);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});