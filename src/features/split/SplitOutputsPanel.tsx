"use client";

import { downloadFile } from "@/lib/download";
import { formatBytes } from "@/lib/files";
import JSZip from "jszip";
import { Download, FileArchive, Files } from "lucide-react";

export type SplitOutput = { filename: string; blob: Blob };

type SplitOutputsPanelProps = {
  outputs: SplitOutput[];
  isProcessing: boolean;
  dateStamp: () => string;
};

export function SplitOutputsPanel({
  outputs,
  isProcessing,
  dateStamp,
}: SplitOutputsPanelProps) {
  if (outputs.length === 0) return null;

  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-2xl bg-black/[0.02] px-4 py-3 dark:bg-white/[0.03]">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-[color:var(--primary)]/10 text-[color:var(--primary)]">
            <Files className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="flex items-baseline gap-2">
            <h4 className="text-sm font-semibold">생성된 파일</h4>
            <span className="rounded-full bg-[color:var(--primary)]/10 px-2 py-0.5 text-xs font-medium text-[color:var(--primary)]">
              {outputs.length}
            </span>
          </div>
        </div>

        {outputs.length > 1 ? (
          <button
            type="button"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-black/15 bg-white px-4 text-sm font-medium hover:bg-black/[0.03] disabled:opacity-50 dark:border-white/20 dark:bg-black dark:hover:bg-white/[0.06]"
            disabled={isProcessing}
            onClick={async () => {
              const zip = new JSZip();
              for (const item of outputs) zip.file(item.filename, item.blob);
              const content = await zip.generateAsync({ type: "blob" });
              const filename = `split_${dateStamp()}.zip`;
              downloadFile(new File([content], filename, { type: content.type }));
            }}
          >
            <FileArchive className="h-4 w-4" aria-hidden="true" />
            전체 다운로드
          </button>
        ) : (
          <button
            type="button"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-black/15 bg-white px-4 text-sm font-medium hover:bg-black/[0.03] disabled:opacity-50 dark:border-white/20 dark:bg-black dark:hover:bg-white/[0.06]"
            disabled={isProcessing}
            onClick={() => {
              const item = outputs[0];
              downloadFile(
                new File([item.blob], item.filename, { type: item.blob.type }),
              );
            }}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            다운로드
          </button>
        )}
      </div>

      <ul className="divide-y divide-black/10 overflow-hidden rounded-b-2xl dark:divide-white/10">
        {outputs.map((item) => (
          <li
            key={item.filename}
            className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{item.filename}</div>
              <div className="text-xs text-black/60 dark:text-white/60">
                {formatBytes(item.blob.size)}
              </div>
            </div>
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-black/15 bg-white px-4 text-sm font-medium hover:bg-black/[0.03] disabled:opacity-50 dark:border-white/20 dark:bg-black dark:hover:bg-white/[0.06]"
              disabled={isProcessing}
              onClick={() =>
                downloadFile(
                  new File([item.blob], item.filename, { type: item.blob.type }),
                )
              }
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              다운로드
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
