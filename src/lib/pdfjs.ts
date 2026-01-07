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
      // Use module worker to avoid classic-worker execution errors.
      workerOptions.workerPort =
        typeof window !== "undefined"
          ? new Worker(workerUrl, { type: "module" })
          : null;
      workerOptions.workerSrc = workerUrl;
      return mod;
    });
  }
  return pdfjsPromise;
}
