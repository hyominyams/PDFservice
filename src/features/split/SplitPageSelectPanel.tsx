"use client";

import { PdfThumbnailGrid } from "@/features/split/PdfThumbnailGrid";
import { extractPdfPages } from "@/features/split/extractPdfPages";
import type { SplitOutput } from "@/features/split/SplitOutputsPanel";
import { useMemo, useState } from "react";

type SplitPageSelectPanelProps = {
  file: File;
  pageCount: number | null;
  isProcessing: boolean;
  setIsProcessing: (next: boolean) => void;
  setErrorMessage: (message: string) => void;
  setOutputs: React.Dispatch<React.SetStateAction<SplitOutput[]>>;
  dateStamp: () => string;
};

export function SplitPageSelectPanel({
  file,
  pageCount,
  isProcessing,
  setIsProcessing,
  setErrorMessage,
  setOutputs,
  dateStamp,
}: SplitPageSelectPanelProps) {
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());

  const safePageCount = pageCount ?? 0;

  const selectedCount = useMemo(
    () => Array.from(selectedPages).length,
    [selectedPages],
  );

  function toggle(pageNumber: number) {
    setOutputs([]);
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageNumber)) next.delete(pageNumber);
      else next.add(pageNumber);
      return next;
    });
  }

  function selectAll() {
    setOutputs([]);
    setSelectedPages(new Set(Array.from({ length: safePageCount }, (_, i) => i + 1)));
  }

  function clear() {
    setOutputs([]);
    setSelectedPages(new Set());
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 bg-black/[0.02] px-4 py-3 text-xs text-black/60 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/60">
        <div>
          선택된 페이지:{" "}
          <span className="font-semibold text-black/80 dark:text-white/80">
            {selectedCount}
          </span>
        </div>
        <div className="text-black/50 dark:text-white/50">
          선택한 페이지를 하나의 PDF로 추출합니다.
        </div>
      </div>

      {pageCount ? (
        <PdfThumbnailGrid
          key={`${file.name}-${file.size}-${file.lastModified}`}
          file={file}
          pageCount={pageCount}
          selectedPages={selectedPages}
          onTogglePage={toggle}
          onSelectAll={selectAll}
          onClear={clear}
          disabled={isProcessing}
        />
      ) : (
        <p className="text-xs text-black/50 dark:text-white/50">
          페이지 정보를 불러오는 중입니다.
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-black/50 dark:text-white/50">
          페이지를 선택한 뒤 “추출”을 눌러주세요.
        </p>
        <button
          type="button"
          className="inline-flex h-10 items-center justify-center rounded-full bg-[color:var(--primary)] px-5 text-sm font-medium text-white shadow-sm hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isProcessing || selectedCount === 0 || !pageCount}
          onClick={async () => {
            if (!pageCount) return;
            const pages = Array.from(selectedPages)
              .filter((n) => n >= 1 && n <= pageCount)
              .sort((a, b) => a - b);
            if (pages.length === 0) {
              setErrorMessage("선택된 페이지가 없어요.");
              return;
            }
            setErrorMessage("");
            setIsProcessing(true);
            try {
              const bytes = await extractPdfPages(file, pages);
              const safeBytes = new Uint8Array(bytes);
              const blob = new Blob([safeBytes], { type: "application/pdf" });
              const filename = `split_selected_${dateStamp()}.pdf`;
              setOutputs([{ filename, blob }]);
            } catch {
              setErrorMessage(
                "추출에 실패했어요. 파일이 손상되었거나 암호화된 PDF일 수 있어요.",
              );
            } finally {
              setIsProcessing(false);
            }
          }}
        >
          {isProcessing ? "추출하는 중..." : "선택 페이지 추출"}
        </button>
      </div>
    </div>
  );
}
