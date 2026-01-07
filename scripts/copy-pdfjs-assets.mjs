import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const srcBase = path.join(repoRoot, "node_modules", "pdfjs-dist");
const destBase = path.join(repoRoot, "public", "pdfjs");

const folders = [
  ["cmaps", "cmaps"],
  ["standard_fonts", "standard_fonts"],
  ["iccs", "iccs"],
  ["wasm", "wasm"],
];

async function main() {
  await mkdir(destBase, { recursive: true });

  for (const [, dest] of folders) {
    const to = path.join(destBase, dest);
    await rm(to, { recursive: true, force: true });
  }

  for (const [src, dest] of folders) {
    const from = path.join(srcBase, src);
    const to = path.join(destBase, dest);
    await cp(from, to, { recursive: true, force: true });
  }

  const workerSrc = path.join(srcBase, "build", "pdf.worker.min.mjs");
  const workerDest = path.join(destBase, "pdf.worker.mjs");
  await cp(workerSrc, workerDest, { force: true });

  console.log("pdfjs assets copied to public/pdfjs/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
