import fs from 'node:fs/promises';
import path from 'node:path';
import { createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { gzip } from 'node:zlib';
import { promisify } from 'node:util';
import { createDemoRedactor } from './demo-redaction.js';

const gzipAsync = promisify(gzip);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const caseDir = path.join(root, 'Slides & Materials - Shared w- Participants', 'Sapini Case Materials');
const cacheDir = path.join(root, '.cache', 'ocr');
process.env.TEXT_CACHE_DIR = cacheDir;
process.chdir(root);
const { extractPdf, readPdfCache } = await import('../src/ingest/extract.js');

async function sha256File(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}

const manifest = JSON.parse(await fs.readFile(path.join(caseDir, 'sapini-clio-data.json'), 'utf8'));
const documents = manifest.documents.items;
const redactText = createDemoRedactor(manifest.contacts.items);
const redactions = { contactIdentifiers: 0, email: 0, phone: 0, ssn: 0, birthDate: 0, recordIdentifier: 0 };
const refresh = process.argv.includes('--refresh');
await fs.mkdir(cacheDir, { recursive: true });

for (const [index, item] of documents.entries()) {
  const pdf = path.resolve(caseDir, item.local_path);
  const stat = await fs.stat(pdf);
  if (item.bytes && stat.size !== item.bytes) throw new Error(`PDF size does not match manifest: ${item.local_path}`);
  const fileHash = await sha256File(pdf);
  if (item.sha256 && fileHash !== item.sha256) throw new Error(`PDF hash does not match manifest: ${item.local_path}`);

  const rawCache = path.join(cacheDir, `${fileHash}.json`);
  const compressedCache = `${rawCache}.gz`;
  if (refresh) await fs.rm(compressedCache, { force: true });
  let result;
  try {
    await fs.access(compressedCache);
    result = await readPdfCache(fileHash);
    if (!result) throw new Error(`Compressed cache is empty: ${compressedCache}`);
    console.log(`[${index + 1}/${documents.length}] Reusing ${path.basename(pdf)} cache`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  if (!result) {
    console.log(`[${index + 1}/${documents.length}] Extracting ${path.basename(pdf)} (${stat.size} bytes)`);
    result = await extractPdf(pdf, {
      onProgress: (page, total) => {
        if (page % 25 === 0 || page === total) console.log(`  ${page}/${total} pages`);
      },
    });
  }
  if (result.sha256 !== fileHash) throw new Error(`Extraction hash mismatch: ${item.local_path}`);

  for (const page of result.pages) page.text = redactText(page.text, redactions);
  const tmp = `${compressedCache}.${process.pid}.tmp`;
  await fs.writeFile(tmp, await gzipAsync(Buffer.from(JSON.stringify(result)), { level: 9 }));
  await fs.rename(tmp, compressedCache);
  await fs.rm(rawCache, { force: true });
  for (const name of await fs.readdir(cacheDir)) {
    if (name.startsWith(`${fileHash}_`) && name.endsWith('.json')) await fs.rm(path.join(cacheDir, name));
  }
  console.log(`  Cached ${result.pageCount} pages (${result.pages.filter(page => page.method === 'ocr').length} OCR pages)`);
}

const artifacts = await fs.readdir(cacheDir);
if (artifacts.some(name => !/^[a-f0-9]{64}\.json\.gz$/.test(name))) {
  throw new Error(`Unexpected files remain in ${cacheDir}; inspect before committing cache artifacts.`);
}
console.log(`Ready: ${documents.length} compressed demo OCR caches in ${path.relative(root, cacheDir)}.`);
console.log(`Redacted direct identifiers: ${JSON.stringify(redactions)}.`);
