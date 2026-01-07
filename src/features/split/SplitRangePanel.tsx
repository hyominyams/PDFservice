"use client";

import { splitPdfByRanges, type PdfRange } from "@/features/split/splitPdfRanges";
import { useMemo } from "react";

import type { SplitOutput } from "@/features/split/SplitOutputsPanel";

type SplitRangePanelProps = {
  file: File;
  pageCount: number | null;
  ranges: PdfRange[];
  setRanges: React.Dispatch<React.SetStateAction<PdfRange[]>>;
  setOutputs: React.Dispatch<React.SetStateAction<SplitOutput[]>>;
  isProcessing: boolean;
  setIsProcessing: (next: boolean) => void;
  setErrorMessage: (message: string) => void;
  dateStamp: () => string;
};

function validateSplitRanges(
  pageCount: number | null,
  ranges: PdfRange[],
): { isValid: boolean; message: string } {
  if (!pageCount) return { isValid: false, message: "페이지 정보를 불러오는 중..." };
  if (ranges.length === 0)
    return { isValid: false, message: "분할 범위를 하나 이상 추가해주세요." };

  for (const [index, range] of ranges.entries()) {
    if (!Number.isFinite(range.start) || !Number.isFinite(range.end)) {
      return {
        isValid: false,
        message: `${index + 1}번째 범위의 페이지 번호가 올바르지 않아요.`,
      };
    }
    if (range.start < 1 || range.end < 1) {
      return {
        isValid: false,
        message: `${index + 1}번째 범위는 1페이지 이상이어야 해요.`,
      };
    }
    if (range.start > range.end) {
      return {
        isValid: false,
        message: `${index + 1}번째 범위는 시작 ≤ 끝이어야 해요.`,
      };
    }
    if (pageCount && range.end > pageCount) {
      return {
        isValid: false,
        message: `${index + 1}번째 범위의 끝 페이지가 총 페이지 수(${pageCount})를 넘어요.`,
      };
    }
  }

  const sorted = [...ranges].sort((a, b) => a.start - b.start || a.end - b.end);
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1];
    const cur = sorted[i];
    if (cur.start <= prev.end) {
      return { isValid: false, message: "분할 범위가 서로 겹치면 안 돼요." };
    }
  }

  return { isValid: true, message: "" };
}

export function SplitRangePanel({
  file,
  pageCount,
  ranges,
  setRanges,
  setOutputs,
  isProcessing,
  setIsProcessing,
  setErrorMessage,
  dateStamp,
}: SplitRangePanelProps) {
  const validation = useMemo(
    () => validateSplitRanges(pageCount, ranges),
    [pageCount, ranges],
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 bg-black/[0.02] px-4 py-3 text-xs text-black/60 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/60">
        <div>
          총 페이지:{" "}
          <span className="font-semibold text-black/80 dark:text-white/80">
            {pageCount ?? "-"}
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
        <div className="flex items-center justify-between gap-3 bg-black/[0.02] px-4 py-2 text-xs text-black/60 dark:bg-white/[0.03] dark:text-white/60">
          <div>분할 범위</div>
          <button
            type="button"
            className="text-xs font-medium text-[color:var(--primary)] hover:underline disabled:opacity-50"
            disabled={isProcessing || !pageCount}
            onClick={() => {
              setOutputs([]);
              setRanges((prev) => {
                const last = prev[prev.length - 1];
                const nextStart = last ? last.end + 1 : 1;
                const safeStart = pageCount ? Math.min(nextStart, pageCount) : nextStart;
                return [...prev, { start: safeStart, end: safeStart }];
              });
            }}
          >
            + 범위 추가
          </button>
        </div>

        <div className="divide-y divide-black/10 dark:divide-white/10">
          {ranges.map((range, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-black/60 dark:text-white/60">
                  {index + 1}.
                </span>
                <label className="flex items-center gap-2 text-xs text-black/60 dark:text-white/60">
                  시작
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={pageCount ?? undefined}
                    value={range.start}
                    disabled={isProcessing || !pageCount}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setOutputs([]);
                      setRanges((prev) =>
                        prev.map((r, i) => (i === index ? { ...r, start: value } : r)),
                      );
                    }}
                    className="h-9 w-20 rounded-lg border border-black/15 bg-white px-2 text-sm text-black/80 shadow-sm outline-none focus:border-[color:var(--primary)] dark:border-white/20 dark:bg-black dark:text-white/80"
                  />
                </label>
                <span className="text-xs text-black/40 dark:text-white/40">~</span>
                <label className="flex items-center gap-2 text-xs text-black/60 dark:text-white/60">
                  끝
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={pageCount ?? undefined}
                    value={range.end}
                    disabled={isProcessing || !pageCount}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setOutputs([]);
                      setRanges((prev) =>
                        prev.map((r, i) => (i === index ? { ...r, end: value } : r)),
                      );
                    }}
                    className="h-9 w-20 rounded-lg border border-black/15 bg-white px-2 text-sm text-black/80 shadow-sm outline-none focus:border-[color:var(--primary)] dark:border-white/20 dark:bg-black dark:text-white/80"
                  />
                </label>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="inline-flex h-9 items-center justify-center rounded-full border border-black/15 bg-white px-4 text-sm font-medium hover:bg-black/[0.03] disabled:opacity-50 dark:border-white/20 dark:bg-black dark:hover:bg-white/[0.06]"
                  disabled={isProcessing || ranges.length === 1}
                  onClick={() => {
                    setOutputs([]);
                    setRanges((prev) => prev.filter((_, i) => i !== index));
                  }}
                >
                  제거
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {!validation.isValid ? (
        <div
          role="alert"
          className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-900 dark:text-yellow-200"
        >
          {validation.message}
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-black/50 dark:text-white/50">
          예: 1-3, 4-6처럼 여러 범위를 추가할 수 있어요.
        </p>
        <button
          type="button"
          className="inline-flex h-10 items-center justify-center rounded-full bg-[color:var(--primary)] px-5 text-sm font-medium text-white shadow-sm hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isProcessing || !validation.isValid || ranges.length === 0}
          onClick={async () => {
            const currentValidation = validateSplitRanges(pageCount, ranges);
            if (!currentValidation.isValid) {
              setErrorMessage(currentValidation.message);
              return;
            }

            setErrorMessage("");
            setIsProcessing(true);
            try {
              const parts = await splitPdfByRanges(file, ranges);
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
          {isProcessing ? "분할하는 중..." : "분할"}
        </button>
      </div>
    </div>
  );
}
