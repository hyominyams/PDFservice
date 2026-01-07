import { PDFDocument } from "pdf-lib";

export type PdfRange = {
  start: number; // 1-based inclusive
  end: number; // 1-based inclusive
};

export async function getPdfPageCount(file: File): Promise<number> {
  const bytes = await file.arrayBuffer();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  return doc.getPageCount();
}

export async function splitPdfByRanges(
  file: File,
  ranges: PdfRange[],
): Promise<Uint8Array[]> {
  const bytes = await file.arrayBuffer();
  const source = await PDFDocument.load(bytes, { ignoreEncryption: true });

  const outputs: Uint8Array[] = [];
  for (const range of ranges) {
    const out = await PDFDocument.create();
    const startIndex = range.start - 1;
    const endIndex = range.end - 1;
    const indices: number[] = [];
    for (let i = startIndex; i <= endIndex; i += 1) indices.push(i);
    const pages = await out.copyPages(source, indices);
    for (const page of pages) out.addPage(page);
    outputs.push(await out.save());
  }

  return outputs;
}

