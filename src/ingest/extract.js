// Page-level text extraction for documents pulled from Clio.
// Native text first; scanned pages are rasterised and OCR'd. Per-page disk caches
// allow an interrupted document to resume without repeating completed pages.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { gunzip } from 'node:zlib';
import { withPdfWorker } from './pdf-workers.js';

const run = promisify(execFile);
const ungzip = promisify(gunzip);
const CACHE_DIR = process.env.TEXT_CACHE_DIR || path.resolve('.cache/ocr');
const MIN_NATIVE_CHARS = 40;

async function sha256File(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}

async function pageCount(file) {
  return withPdfWorker(async () => {
    const { stdout } = await run('pdfinfo', [file]);
    const match = stdout.match(/Pages:\s+(\d+)/);
    return match ? Number(match[1]) : 0;
  });
}

async function nativeText(file, page) {
  const { stdout } = await run('pdftotext', ['-layout', '-f', String(page), '-l', String(page), file, '-'], { maxBuffer: 1 << 26 });
  return stdout;
}

async function ocrPage(file, page, tmp) {
  const base = path.join(tmp, `p${page}`);
  await run('pdftoppm', ['-r', '150', '-gray', '-png', '-f', String(page), '-l', String(page), '-singlefile', file, base]);
  try {
    const { stdout } = await run('tesseract', [`${base}.png`, '-', '--psm', '3'], {
      maxBuffer: 1 << 26,
      env: { ...process.env, OMP_THREAD_LIMIT: '1' },
    });
    return stdout;
  } finally {
    await fs.rm(`${base}.png`, { force: true });
  }
}

async function pool(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); }
  });
  await Promise.all(workers);
  return out;
}

async function readPageCache(file) {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); }
  catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

export async function readPdfCache(hash) {
  const cacheFile = path.join(CACHE_DIR, `${hash}.json`);
  try {
    return JSON.parse((await ungzip(await fs.readFile(`${cacheFile}.gz`))).toString('utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  return readPageCache(cacheFile);
}

async function writePageCache(file, page) {
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(page));
  await fs.rename(tmp, file);
}

/** Returns { sha256, pages: [{ page, text, method: 'native'|'ocr' }] }, cached by PDF hash. */
export async function extractPdf(file, { onProgress } = {}) {
  const hash = await sha256File(file);
  await fs.mkdir(CACHE_DIR, { recursive: true });
  const cacheFile = path.join(CACHE_DIR, `${hash}.json`);
  const cached = await readPdfCache(hash);
  if (cached) return cached;

  const total = await pageCount(file);
  const pages = await pool([...Array(total).keys()].map(k => k + 1), 2, async page => {
    const pageCache = path.join(CACHE_DIR, `${hash}_${page}.json`);
    let result = await readPageCache(pageCache);
    if (!result) {
      result = await withPdfWorker(async () => {
        let text = await nativeText(file, page);
        let method = 'native';
        if (text.replace(/\s/g, '').length < MIN_NATIVE_CHARS) {
          const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'caselight-'));
          try { text = await ocrPage(file, page, tmp); }
          finally { await fs.rm(tmp, { recursive: true, force: true }); }
          method = 'ocr';
        }
        return { page, text: text.replace(/\f/g, '').trim(), method };
      });
      await writePageCache(pageCache, result);
    }
    onProgress?.(page, total);
    return result;
  });

  const result = { sha256: hash, pageCount: total, pages };
  const tmp = `${cacheFile}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(result));
  await fs.rename(tmp, cacheFile);
  return result;
}

/** Pull embedded images (e.g. the client's photo ID) out of a PDF path. */
export async function extractImages(file) {
  return withPdfWorker(async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'caselight-img-'));
    try {
      await run('pdfimages', ['-png', file, path.join(tmp, 'img')]);
      const names = (await fs.readdir(tmp)).filter(f => f.startsWith('img') && f.endsWith('.png')).sort();
      const out = [];
      for (const name of names) out.push(await fs.readFile(path.join(tmp, name)));
      return out;
    } finally {
      await fs.rm(tmp, { recursive: true, force: true });
    }
  });
}
