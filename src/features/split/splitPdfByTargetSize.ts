import { PDFDocument } from "pdf-lib";

export async function splitPdfByPageChunks(
  file: File,
  pagesPerChunk: number,
): Promise<Uint8Array[]> {
  const bytes = await file.arrayBuffer();
  const source = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const pageCount = source.getPageCount();

  const clamped = Math.max(1, Math.floor(pagesPerChunk));
  const outputs: Uint8Array[] = [];

  for (let start = 0; start < pageCount; start += clamped) {
    const end = Math.min(pageCount, start + clamped);
    const out = await PDFDocument.create();
    const indices = [];
    for (let i = start; i < end; i += 1) indices.push(i);
    const pages = await out.copyPages(source, indices);
    for (const page of pages) out.addPage(page);
    outputs.push(await out.save());
  }

  return outputs;
}

export function estimatePagesPerChunkByTargetSize(options: {
  fileSizeBytes: number;
  pageCount: number;
  targetSizeMB: number;
}): number {
  const { fileSizeBytes, pageCount, targetSizeMB } = options;
  const targetBytes = targetSizeMB * 1024 * 1024;
  if (fileSizeBytes <= 0 || pageCount <= 0 || targetBytes <= 0) return pageCount;
  const ratio = targetBytes / fileSizeBytes;
  const estimated = Math.ceil(pageCount * ratio);
  return Math.max(1, Math.min(pageCount, estimated));
}

