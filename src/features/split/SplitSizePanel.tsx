"use client";

import {
  estimatePagesPerChunkByTargetSize,
  splitPdfByPageChunks,
} from "@/features/split/splitPdfByTargetSize";
import type { SplitOutput } from "@/features/split/SplitOutputsPanel";
import { useMemo, useState } from "react";

type SplitSizePanelProps = {
  file: File;
  pageCount: number | null;
  isProcessing: boolean;
  setIsProcessing: (next: boolean) => void;
  setErrorMessage: (message: string) => void;
  setOutputs: React.Dispatch<React.SetStateAction<SplitOutput[]>>;
  dateStamp: () => string;
};

export function SplitSizePanel({
  file,
  pageCount,
  isProcessing,
  setIsProcessing,
  setErrorMessage,
  setOutputs,
  dateStamp,
}: SplitSizePanelProps) {
  const [targetMB, setTargetMB] = useState<number>(5);

  const estimatedPagesPerChunk = useMemo(() => {
    if (!pageCount) return 0;
    return estimatePagesPerChunkByTargetSize({
      fileSizeBytes: file.size,
      pageCount,
      targetSizeMB: targetMB,
    });
  }, [file.size, pageCount, targetMB]);

  const estimatedPieces = useMemo(() => {
    if (!pageCount || !estimatedPagesPerChunk) return 0;
    return Math.ceil(pageCount / estimatedPagesPerChunk);
  }, [estimatedPagesPerChunk, pageCount]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 bg-black/[0.02] px-4 py-3 text-xs text-black/60 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/60">
        <div className="flex items-center gap-2">
          목표 크기(MB)
          <input
            type="number"
            inputMode="decimal"
            min={0.5}
            step={0.5}
            value={targetMB}
            disabled={isProcessing}
            onChange={(e) => {
              const value = Number(e.target.value);
              setOutputs([]);
              setTargetMB(Number.isFinite(value) ? value : 5);
            }}
            className="h-9 w-24 rounded-lg border border-black/15 bg-white px-2 text-sm text-black/80 shadow-sm outline-none focus:border-[color:var(--primary)] dark:border-white/20 dark:bg-black dark:text-white/80"
          />
        </div>
        <div className="text-black/50 dark:text-white/50">
          예상: {estimatedPieces ? `${estimatedPieces}개` : "-"}
        </div>
      </div>

      <p className="text-xs text-black/50 dark:text-white/50">
        크기 기준 분할은 PDF 구성에 따라 정확하지 않을 수 있어요. (대략적인
        분할)
      </p>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-black/50 dark:text-white/50">
          목표 크기를 입력한 뒤 “분할”을 눌러주세요.
        </p>
        <button
          type="button"
          className="inline-flex h-10 items-center justify-center rounded-full bg-[color:var(--primary)] px-5 text-sm font-medium text-white shadow-sm hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isProcessing || !pageCount || targetMB <= 0}
          onClick={async () => {
            if (!pageCount) return;
            if (!Number.isFinite(targetMB) || targetMB <= 0) {
              setErrorMessage("목표 크기를 올바르게 입력해주세요.");
              return;
            }

            const pagesPerChunk = estimatePagesPerChunkByTargetSize({
              fileSizeBytes: file.size,
              pageCount,
              targetSizeMB: targetMB,
            });

            setErrorMessage("");
            setIsProcessing(true);
            try {
              const parts = await splitPdfByPageChunks(file, pagesPerChunk);
              const stamp = dateStamp();
              const items = parts.map((bytes, index) => {
                const safeBytes = new Uint8Array(bytes);
                const blob = new Blob([safeBytes], { type: "application/pdf" });
                const filename = `split_${index + 1}of${parts.length}_${stamp}.pdf`;
                return { filename, blob };
              });
              setOutputs(items);
            } catch {
              setErrorMessage(
                "분할에 실패했어요. 파일이 손상되었거나 암호화된 PDF일 수 있어요.",
              );
            } finally {
              setIsProcessing(false);
            }
          }}
        >
          {isProcessing ? "분할하는 중..." : "크기 기준 분할"}
        </button>
      </div>
    </div>
  );
}

