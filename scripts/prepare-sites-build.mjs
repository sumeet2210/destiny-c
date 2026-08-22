import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const openNext = resolve(root, '.open-next');
const worker = resolve(openNext, 'worker.js');
const assets = resolve(openNext, 'assets');
const hosting = resolve(root, '.openai', 'hosting.json');
const dist = resolve(root, 'dist');
const server = resolve(dist, 'server');

for (const required of [worker, assets, hosting]) {
  if (!existsSync(required)) {
    throw new Error(`Missing Sites build input: ${required}`);
  }
}

rmSync(dist, { recursive: true, force: true });
mkdirSync(server, { recursive: true });
cpSync(openNext, resolve(server, 'open-next'), { recursive: true });
cpSync(assets, resolve(dist, 'client'), { recursive: true });
mkdirSync(resolve(dist, '.openai'), { recursive: true });
copyFileSync(hosting, resolve(dist, '.openai', 'hosting.json'));
writeFileSync(
  resolve(server, 'index.js'),
  "export { default } from './open-next/worker.js';\n",
);

console.log('Prepared Sites build in dist/.');
