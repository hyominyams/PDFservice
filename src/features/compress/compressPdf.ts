import { getPdfJs, pdfJsAssetUrls } from "@/lib/pdfjs";
import { PDFDocument } from "pdf-lib";

export type RasterizeOptions = {
  scale: number;
  jpegQuality: number; // 0..1
  onProgress?: (current: number, total: number) => void;
};

export async function compressPdfLossless(options: {
  file: File;
  useObjectStreams: boolean;
}): Promise<Uint8Array> {
  const bytes = await options.file.arrayBuffer();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });

  doc.setTitle("");
  doc.setAuthor("");
  doc.setSubject("");
  doc.setKeywords([]);
  doc.setProducer("");
  doc.setCreator("");

  return doc.save({ useObjectStreams: options.useObjectStreams });
}

export async function compressPdfLosslessBest(file: File): Promise<Uint8Array> {
  const bytes = await file.arrayBuffer();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });

  doc.setTitle("");
  doc.setAuthor("");
  doc.setSubject("");
  doc.setKeywords([]);
  doc.setProducer("");
  doc.setCreator("");

  const a = await doc.save({ useObjectStreams: true });
  const b = await doc.save({ useObjectStreams: false });
  return a.byteLength <= b.byteLength ? a : b;
}

export async function compressPdfRasterize(
  file: File,
  options: RasterizeOptions,
): Promise<Uint8Array> {
  const pdfjs = await getPdfJs();
  const buffer = await file.arrayBuffer();
  const task = pdfjs.getDocument({ data: buffer, ...pdfJsAssetUrls });
  const pdf = await task.promise;

  try {
    const out = await PDFDocument.create();
    const total = pdf.numPages;

    for (let pageNumber = 1; pageNumber <= total; pageNumber += 1) {
      options.onProgress?.(pageNumber, total);
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: options.scale });

      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas context is unavailable");

      const renderTask = page.render({ canvasContext: context, viewport, canvas });
      await renderTask.promise;

      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/jpeg", options.jpegQuality),
      );
      if (!blob) throw new Error("Failed to encode page image");

      const imgBytes = new Uint8Array(await blob.arrayBuffer());
      const jpg = await out.embedJpg(imgBytes);

      const pdfPage = out.addPage([viewport.width, viewport.height]);
      pdfPage.drawImage(jpg, {
        x: 0,
        y: 0,
        width: viewport.width,
        height: viewport.height,
      });
    }

    return out.save({ useObjectStreams: true });
  } finally {
    options.onProgress?.(pdf.numPages, pdf.numPages);
    pdf.destroy();
  }
}
