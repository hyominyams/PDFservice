"use client";

type PdfJsModule = typeof import("pdfjs-dist/build/pdf.mjs");

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
    pdfjsPromise = import("pdfjs-dist/build/pdf.mjs").then((mod) => {
      const workerOptions = mod.GlobalWorkerOptions as unknown as {
        workerSrc?: string;
        workerPort?: unknown;
      };
      const workerUrl = "/pdfjs/pdf.worker.mjs";
      try {
        if (typeof window !== "undefined" && typeof Worker !== "undefined") {
          workerOptions.workerPort = new Worker(workerUrl, { type: "module" });
          workerOptions.workerSrc = workerUrl;
        } else {
          workerOptions.workerPort = null;
          workerOptions.workerSrc = undefined;
        }
      } catch (err) {
        // Fallback: disable external worker, let PDF.js use fake worker (main thread).
        console.warn("PDF.js worker failed; falling back to inline worker", err);
        workerOptions.workerPort = null;
        workerOptions.workerSrc = undefined;
      }
      return mod;
    });
  }
  return pdfjsPromise;
}
