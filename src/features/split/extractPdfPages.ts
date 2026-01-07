import { PDFDocument } from "pdf-lib";

export async function extractPdfPages(
  file: File,
  pageNumbers: number[], // 1-based
): Promise<Uint8Array> {
  const bytes = await file.arrayBuffer();
  const source = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const out = await PDFDocument.create();

  const indices = pageNumbers
    .map((n) => n - 1)
    .filter((n) => Number.isInteger(n) && n >= 0 && n < source.getPageCount());

  const uniqueSorted = Array.from(new Set(indices)).sort((a, b) => a - b);
  const pages = await out.copyPages(source, uniqueSorted);
  for (const page of pages) out.addPage(page);

  return out.save();
}

