import { readFile, writeFile, copyFile, rename, mkdir } from 'node:fs/promises';
import { dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// Import a reviewed built-in image-generation output. No image API or credentials.
const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const planPath = resolve(webRoot, 'assets/generated/menu-photo-plan.json');
const receipt = JSON.parse(await readFile(process.argv[2], 'utf8'));
const document = JSON.parse(await readFile(planPath, 'utf8'));
const plan = document.entries;
const entry = plan.find((photo) => photo.id === receipt.id);
if (!entry) throw new Error(`Unknown photo: ${receipt.id}`);
if (!/^Milanos_[A-Za-z0-9]+\.png$/.test(entry.filename) || basename(entry.filename) !== entry.filename) throw new Error('Invalid output filename');
if (!/^[a-z0-9-]+$/.test(entry.id)) throw new Error('Invalid photo id');
const require = createRequire(import.meta.url);
const sharp = require(process.env.MILANOS_SHARP_PATH || 'sharp');
const masterPath = resolve(webRoot, 'assets/generated', entry.filename);
if (resolve(receipt.source) !== masterPath) await copyFile(receipt.source, masterPath);
const metadata = await sharp(masterPath).metadata();
if (!metadata.width || !metadata.height || metadata.format !== 'png') throw new Error('Expected a valid PNG master');
const publicDirectory = resolve(webRoot, 'public/images/menu');
await mkdir(publicDirectory, { recursive: true });
const imagePath = resolve(publicDirectory, `${entry.id}.webp`);
const encoded = await sharp(masterPath).webp({ quality: 86, effort: 6 }).toBuffer();
await writeFile(imagePath + '.tmp', encoded);
await rename(imagePath + '.tmp', imagePath);
entry.status = 'complete';
entry.width = metadata.width;
entry.height = metadata.height;
entry.webSrc = `/images/menu/${entry.id}.webp`;
entry.webBytes = encoded.length;
entry.generatedOn = '2026-10-18';
if (receipt.prompt) entry.prompt = receipt.prompt;
const map = {};
for (const photo of plan.filter((photo) => photo.status === 'complete')) {
  for (const slug of photo.menuSlugs) {
    if (map[slug]) throw new Error(`Duplicate mapping: ${slug}`);
    map[slug] = { src: photo.webSrc, alt: photo.alt || `${photo.title || photo.id.replaceAll('-', ' ')} on Milano's branded white tableware`, width: photo.width, height: photo.height, generated: true };
  }
}
await writeFile(planPath + '.tmp', JSON.stringify(document, null, 2) + '\n');
await rename(planPath + '.tmp', planPath);
const mapPath = resolve(webRoot, 'src/content/menu-images.json');
await writeFile(mapPath + '.tmp', JSON.stringify(map, null, 2) + '\n');
await rename(mapPath + '.tmp', mapPath);
console.log(JSON.stringify({ id: entry.id, master: masterPath, width: entry.width, height: entry.height, webBytes: entry.webBytes, completed: plan.filter((photo) => photo.status === 'complete').length, planned: plan.length, coveredMenuItems: Object.keys(map).length }));
