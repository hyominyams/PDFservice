"use client";

import {
  compressPdfLosslessBest,
  compressPdfRasterize,
} from "@/features/compress/compressPdf";
import { downloadFile } from "@/lib/download";
import { formatBytes } from "@/lib/files";
import { AlertTriangle, CheckCircle2, FileDown } from "lucide-react";
import { useMemo, useState } from "react";

type CompressLevel = "low" | "medium" | "high";

type CompressPanelProps = {
  file: File;
  isProcessing: boolean;
  setIsProcessing: (next: boolean) => void;
  setErrorMessage: (message: string) => void;
  dateStamp: () => string;
};

export function CompressPanel({
  file,
  isProcessing,
  setIsProcessing,
  setErrorMessage,
  dateStamp,
}: CompressPanelProps) {
  const [level, setLevel] = useState<CompressLevel>("medium");
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(
    null,
  );
  const [output, setOutput] = useState<{ filename: string; blob: Blob } | null>(
    null,
  );
  const [outputName, setOutputName] = useState("");
  const [note, setNote] = useState<string>("");

  const baseName = useMemo(() => {
    const name = file.name.replace(/\\.pdf$/i, "");
    return name.length ? name : "file";
  }, [file.name]);

  const defaultFilename = useMemo(
    () => `compressed_${baseName}_${dateStamp()}.pdf`,
    [baseName, dateStamp],
  );

  function normalizePdfFilename(name: string, fallback: string): string {
    const trimmed = name.trim();
    const base = trimmed.length > 0 ? trimmed : fallback;
    return base.toLowerCase().endsWith(".pdf") ? base : `${base}.pdf`;
  }

  const outputStats = useMemo(() => {
    if (!output) return null;
    const before = file.size;
    const after = output.blob.size;
    const ratio = before > 0 ? after / before : 1;
    const percent = Math.round((1 - ratio) * 100);
    return { before, after, percent };
  }, [file.size, output]);

  function explainCompressError(err: unknown): string {
    const message = err instanceof Error ? err.message : String(err);
    if (/Object\.defineProperty called on non-object/i.test(message)) {
      return "PDF 렌더링 엔진(PDF.js)의 WASM/리소스 로딩이 실패했을 때 흔히 발생해요. 보통 `/public/pdfjs/*` 리소스가 없거나, 브라우저/보안 설정(확장 프로그램, CSP)으로 worker/WASM 로드가 막힌 경우입니다.";
    }
    return "";
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 bg-black/[0.02] px-4 py-3 text-xs text-black/60 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/60">
        <div>
          원본 크기:{" "}
          <span className="font-semibold text-black/80 dark:text-white/80">
            {formatBytes(file.size)}
          </span>
        </div>
        <div className="text-black/50 dark:text-white/50">
          레벨에 따라 결과가 달라질 수 있어요.
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-sm font-semibold">압축 레벨</div>
        <div className="inline-flex w-full overflow-hidden rounded-2xl border border-black/15 bg-white shadow-sm dark:border-white/20 dark:bg-black">
          <button
            type="button"
            className={[
              "flex-1 px-4 py-3 text-sm font-medium transition-colors",
              level === "low"
                ? "bg-[color:var(--primary)] text-white"
                : "text-black/70 hover:bg-black/[0.03] dark:text-white/80 dark:hover:bg-white/[0.06]",
            ].join(" ")}
            disabled={isProcessing}
            onClick={() => {
              setOutput(null);
              setLevel("low");
            }}
          >
            낮음
          </button>
          <button
            type="button"
            className={[
              "flex-1 px-4 py-3 text-sm font-medium transition-colors",
              level === "medium"
                ? "bg-[color:var(--primary)] text-white"
                : "text-black/70 hover:bg-black/[0.03] dark:text-white/80 dark:hover:bg-white/[0.06]",
            ].join(" ")}
            disabled={isProcessing}
            onClick={() => {
              setOutput(null);
              setLevel("medium");
            }}
          >
            중간
          </button>
          <button
            type="button"
            className={[
              "flex-1 px-4 py-3 text-sm font-medium transition-colors",
              level === "high"
                ? "bg-[color:var(--primary)] text-white"
                : "text-black/70 hover:bg-black/[0.03] dark:text-white/80 dark:hover:bg-white/[0.06]",
            ].join(" ")}
            disabled={isProcessing}
            onClick={() => {
              setOutput(null);
              setLevel("high");
            }}
          >
            높음
          </button>
        </div>

        {level === "high" ? (
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-900 dark:text-yellow-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4" aria-hidden="true" />
              <div>
                <div className="font-semibold">주의</div>
                <div className="text-sm">
                  높음은 페이지를 이미지로 재구성합니다. 텍스트 검색/복사가
                  어려워질 수 있어요.
                </div>
              </div>
            </div>
          </div>
        ) : level === "medium" ? (
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-900 dark:text-yellow-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4" aria-hidden="true" />
              <div>
                <div className="font-semibold">안내</div>
                <div className="text-sm">
                  중간은 이미지 기반으로 재구성할 수 있어요. 텍스트 검색/복사
                  품질이 영향을 받을 수 있습니다.
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-black/50 dark:text-white/50">
          압축을 실행하면 결과 파일이 생성되고, 원할 때 다운로드할 수 있어요.
        </p>
        <button
          type="button"
          className="inline-flex h-10 items-center justify-center rounded-full bg-[color:var(--primary)] px-5 text-sm font-medium text-white shadow-sm hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isProcessing}
          onClick={async () => {
            setErrorMessage("");
            setIsProcessing(true);
            setProgress(null);
            setNote("");
            try {
              let bytes: Uint8Array;
              if (level === "high" || level === "medium") {
                setProgress({ current: 0, total: 0 });
                try {
                  bytes = await compressPdfRasterize(file, {
                    scale: level === "high" ? 0.95 : 1.15,
                    jpegQuality: level === "high" ? 0.6 : 0.75,
                    onProgress: (current, total) =>
                      setProgress({ current, total }),
                  });
                } catch (err) {
                  const extra = explainCompressError(err);
                  const fallback = await compressPdfLosslessBest(file);
                  bytes = fallback;
                  setNote(
                    extra
                      ? `${extra} 대신 무손실(낮음) 방식으로 결과를 생성했어요.`
                      : "선택한 레벨에서 실패해 무손실(낮음) 방식으로 결과를 생성했어요.",
                  );
                }
              } else {
                bytes = await compressPdfLosslessBest(file);
              }

              if (level !== "low" && bytes.byteLength >= file.size) {
                const lossless = await compressPdfLosslessBest(file);
                if (lossless.byteLength < bytes.byteLength) {
                  bytes = lossless;
                  setNote(
                    "선택한 레벨에서 용량이 줄지 않아, 더 작은 결과를 자동으로 선택했어요.",
                  );
                } else {
                  setNote("이 파일은 압축 효과가 거의 없을 수 있어요.");
                }
              }

              const safeBytes = new Uint8Array(bytes);
              const blob = new Blob([safeBytes], { type: "application/pdf" });
              const filename = defaultFilename;
              setOutput({ filename, blob });
              setOutputName(filename);
            } catch (err) {
              const extra = explainCompressError(err);
              setErrorMessage(
                err instanceof Error
                  ? `압축에 실패했어요: ${err.message}`
                  : "압축에 실패했어요. 파일이 손상되었거나 암호화된 PDF일 수 있어요.",
              );
              if (extra) setNote(extra);
            } finally {
              setIsProcessing(false);
              setProgress(null);
            }
          }}
        >
          {isProcessing ? "처리 중..." : "압축"}
        </button>
      </div>

      {progress && progress.total > 0 ? (
        <div className="rounded-xl border border-black/10 bg-black/[0.02] px-4 py-3 text-xs text-black/60 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/60">
          처리 중: {progress.current}/{progress.total}
        </div>
      ) : null}

      {output ? (
        <div className="rounded-2xl border border-[color:var(--primary)]/30 bg-[color:var(--primary)]/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2
                className="h-5 w-5 text-[color:var(--primary)]"
                aria-hidden="true"
              />
              <div className="text-sm font-semibold">압축 파일이 준비됐어요</div>
            </div>
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-full border border-black/15 bg-white px-4 text-sm font-medium hover:bg-black/[0.03] disabled:opacity-50 dark:border-white/20 dark:bg-black dark:hover:bg-white/[0.06]"
              disabled={isProcessing}
              onClick={() => setOutput(null)}
            >
              삭제
            </button>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-xs text-black/70 dark:border-white/10 dark:bg-black/30 dark:text-white/70">
              <div className="text-black/50 dark:text-white/50">원본</div>
              <div className="mt-1 text-sm font-semibold">
                {formatBytes(outputStats?.before ?? file.size)}
              </div>
            </div>
            <div className="rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-xs text-black/70 dark:border-white/10 dark:bg-black/30 dark:text-white/70">
              <div className="text-black/50 dark:text-white/50">결과</div>
              <div className="mt-1 text-sm font-semibold">
                {formatBytes(outputStats?.after ?? output.blob.size)}
              </div>
            </div>
            <div className="rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-xs text-black/70 dark:border-white/10 dark:bg-black/30 dark:text-white/70">
              <div className="text-black/50 dark:text-white/50">변화</div>
              <div className="mt-1 text-sm font-semibold">
                {outputStats ? `${outputStats.percent}%` : "-"}
              </div>
            </div>
          </div>

          {note ? (
            <div className="mt-3 rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-xs text-black/70 dark:border-white/10 dark:bg-black/30 dark:text-white/70">
              {note}
            </div>
          ) : null}

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex-1">
              <label className="text-xs text-black/60 dark:text-white/60">
                파일명
              </label>
              <input
                value={outputName}
                onChange={(e) => setOutputName(e.target.value)}
                disabled={isProcessing}
                className="mt-1 h-10 w-full rounded-xl border border-black/15 bg-white px-3 text-sm text-black/80 shadow-sm outline-none focus:border-[color:var(--primary)] dark:border-white/20 dark:bg-black dark:text-white/80"
              />
            </div>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[color:var(--primary)] px-5 text-sm font-medium text-white shadow-sm hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isProcessing}
              onClick={() => {
                const filename = normalizePdfFilename(outputName, output.filename);
                downloadFile(
                  new File([output.blob], filename, { type: output.blob.type }),
                );
              }}
            >
              <FileDown className="h-4 w-4" aria-hidden="true" />
              다운로드
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
