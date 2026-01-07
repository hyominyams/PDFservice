"use client";

import { SplitOutputsPanel, type SplitOutput } from "@/features/split/SplitOutputsPanel";
import { SplitPageSelectPanel } from "@/features/split/SplitPageSelectPanel";
import { SplitRangePanel } from "@/features/split/SplitRangePanel";
import { SplitSizePanel } from "@/features/split/SplitSizePanel";
import type { PdfRange } from "@/features/split/splitPdfRanges";
import { useState } from "react";

type SplitMethod = "range" | "pages" | "size";

type SplitPanelProps = {
  file: File;
  pageCount: number | null;
  ranges: PdfRange[];
  setRanges: React.Dispatch<React.SetStateAction<PdfRange[]>>;
  outputs: SplitOutput[];
  setOutputs: React.Dispatch<React.SetStateAction<SplitOutput[]>>;
  isProcessing: boolean;
  setIsProcessing: (next: boolean) => void;
  setErrorMessage: (message: string) => void;
  dateStamp: () => string;
};

export function SplitPanel({
  file,
  pageCount,
  ranges,
  setRanges,
  outputs,
  setOutputs,
  isProcessing,
  setIsProcessing,
  setErrorMessage,
  dateStamp,
}: SplitPanelProps) {
  const [method, setMethod] = useState<SplitMethod>("range");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">분할 방식</span>
          <span className="text-xs text-black/50 dark:text-white/50">
            (범위 / 페이지 선택 / 크기 기준)
          </span>
        </div>

        <div className="inline-flex overflow-hidden rounded-full border border-black/15 bg-white shadow-sm dark:border-white/20 dark:bg-black">
          <button
            type="button"
            className={[
              "px-4 py-2 text-sm font-medium transition-colors",
              method === "range"
                ? "bg-[color:var(--primary)] text-white"
                : "text-black/70 hover:bg-black/[0.03] dark:text-white/80 dark:hover:bg-white/[0.06]",
            ].join(" ")}
            disabled={isProcessing}
            onClick={() => {
              setOutputs([]);
              setMethod("range");
            }}
          >
            범위
          </button>
          <button
            type="button"
            className={[
              "px-4 py-2 text-sm font-medium transition-colors",
              method === "pages"
                ? "bg-[color:var(--primary)] text-white"
                : "text-black/70 hover:bg-black/[0.03] dark:text-white/80 dark:hover:bg-white/[0.06]",
            ].join(" ")}
            disabled={isProcessing}
            onClick={() => {
              setOutputs([]);
              setMethod("pages");
            }}
          >
            페이지 선택
          </button>
          <button
            type="button"
            className={[
              "px-4 py-2 text-sm font-medium transition-colors",
              method === "size"
                ? "bg-[color:var(--primary)] text-white"
                : "text-black/70 hover:bg-black/[0.03] dark:text-white/80 dark:hover:bg-white/[0.06]",
            ].join(" ")}
            disabled={isProcessing}
            onClick={() => {
              setOutputs([]);
              setMethod("size");
            }}
          >
            크기 기준
          </button>
        </div>
      </div>

      {method === "range" ? (
        // Phase 3: range-based split
        <SplitRangePanel
          file={file}
          pageCount={pageCount}
          ranges={ranges}
          setRanges={setRanges}
          setOutputs={setOutputs}
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
          setErrorMessage={setErrorMessage}
          dateStamp={dateStamp}
        />
      ) : null}

      {method === "pages" ? (
        // Phase 4: page selection split (with thumbnails)
        <SplitPageSelectPanel
          file={file}
          pageCount={pageCount}
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
          setErrorMessage={setErrorMessage}
          setOutputs={setOutputs}
          dateStamp={dateStamp}
        />
      ) : null}

      {method === "size" ? (
        // Phase 4: size-based split (approx)
        <SplitSizePanel
          file={file}
          pageCount={pageCount}
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
          setErrorMessage={setErrorMessage}
          setOutputs={setOutputs}
          dateStamp={dateStamp}
        />
      ) : null}

      <SplitOutputsPanel
        outputs={outputs}
        isProcessing={isProcessing}
        dateStamp={dateStamp}
      />
    </div>
  );
}
