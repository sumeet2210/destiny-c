import { copyFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const hosting = resolve(root, '.openai', 'hosting.json');
const dist = resolve(root, 'dist');
const server = resolve(dist, 'server');
const worker = resolve(server, 'index.js');
const client = resolve(dist, 'client');

for (const required of [worker, client, hosting]) {
  if (!existsSync(required)) {
    throw new Error(`Missing Sites build input: ${required}`);
  }
}

// Vinext mirrors local development variables for Wrangler. Sites receives
// production variables through its environment settings, never the archive.
rmSync(resolve(server, '.dev.vars'), { force: true });
mkdirSync(resolve(dist, '.openai'), { recursive: true });
copyFileSync(hosting, resolve(dist, '.openai', 'hosting.json'));

console.log('Prepared Sites build in dist/.');
