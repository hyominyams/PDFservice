"use client";

type PdfJsModule = typeof import("pdfjs-dist/webpack.mjs");

let pdfjsPromise: Promise<PdfJsModule> | null = null;

export const pdfJsAssetUrls = {
  cMapUrl: "/pdfjs/cmaps/",
  cMapPacked: true,
  iccUrl: "/pdfjs/iccs/",
  standardFontDataUrl: "/pdfjs/standard_fonts/",
  wasmUrl: "/pdfjs/wasm/",
  useSystemFonts: true,
} as const;

export async function getPdfJs(): Promise<PdfJsModule> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist/webpack.mjs")
      .catch(() => import("pdfjs-dist/build/pdf.mjs"))
      .then((mod) => {
        const workerOptions = mod.GlobalWorkerOptions as unknown as {
          workerSrc?: string;
          workerPort?: unknown;
        };
        // Force inline/fake worker to avoid module-worker issues in the browser bundle.
        workerOptions.workerPort = null;
        workerOptions.workerSrc = undefined;
        return mod;
      });
  }
  return pdfjsPromise;
}
