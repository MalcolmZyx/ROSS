const MAX_PDF_WORKERS = 2;
let active = 0;
const waiting = [];

export async function withPdfWorker(task) {
  if (active >= MAX_PDF_WORKERS) await new Promise(resolve => waiting.push(resolve));
  else active++;

  try {
    return await task();
  } finally {
    const next = waiting.shift();
    if (next) next();
    else active--;
  }
}
