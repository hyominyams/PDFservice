"use client";

import { PdfDropzone } from "@/components/PdfDropzone";
import { CompressPanel } from "@/features/compress/CompressPanel";
import { mergePdfFiles } from "@/features/merge/mergePdf";
import { SplitPanel } from "@/features/split/SplitPanel";
import type { SplitOutput } from "@/features/split/SplitOutputsPanel";
import { getPdfPageCount, type PdfRange } from "@/features/split/splitPdfRanges";
import { downloadFile } from "@/lib/download";
import { formatBytes } from "@/lib/files";
import {
  ArrowRight,
  CheckCircle2,
  FileDown,
  Files,
  Layers,
  Scissors,
  Shrink,
  ShieldCheck,
  Zap,
  CloudOff,
} from "lucide-react";
import { useMemo, useState } from "react";

type Mode = "merge" | "split" | "compress";

export default function Home() {
  const [mode, setMode] = useState<Mode>("merge");
  const [errorMessage, setErrorMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const [mergeFiles, setMergeFiles] = useState<File[]>([]);

  const [splitFile, setSplitFile] = useState<File | null>(null);
  const [splitPageCount, setSplitPageCount] = useState<number | null>(null);
  const [splitRanges, setSplitRanges] = useState<PdfRange[]>([]);
  const [splitOutputs, setSplitOutputs] = useState<SplitOutput[]>([]);

  const [compressFile, setCompressFile] = useState<File | null>(null);
  const [mergeOutput, setMergeOutput] = useState<{
    filename: string;
    blob: Blob;
  } | null>(null);
  const [mergeOutputName, setMergeOutputName] = useState("");

  const selectedFiles = useMemo(() => {
    if (mode === "merge") return mergeFiles;
    if (mode === "split") return splitFile ? [splitFile] : [];
    return compressFile ? [compressFile] : [];
  }, [compressFile, mergeFiles, mode, splitFile]);

  const hasLargeFile = useMemo(
    () => selectedFiles.some((file) => file.size >= 50 * 1024 * 1024),
    [selectedFiles],
  );

  const mergeDisplayNames = useMemo(() => {
    const counts = new Map<string, number>();
    const displayNames: string[] = [];
    for (const file of mergeFiles) {
      const current = counts.get(file.name) ?? 0;
      const next = current + 1;
      counts.set(file.name, next);
      displayNames.push(next === 1 ? file.name : `${file.name} (${next})`);
    }
    return displayNames;
  }, [mergeFiles]);

  const hasDuplicateMergeNames = useMemo(() => {
    const seen = new Set<string>();
    for (const file of mergeFiles) {
      if (seen.has(file.name)) return true;
      seen.add(file.name);
    }
    return false;
  }, [mergeFiles]);

  const modeCopy = useMemo(() => {
    switch (mode) {
      case "merge":
        return {
          title: "Merge PDFs",
          subtitle: "합체",
          description: "여러 PDF를 하나로 합칩니다. 파일은 서버로 전송되지 않습니다.",
        };
      case "split":
        return {
          title: "Split PDF",
          subtitle: "분할",
          description: "한 PDF를 여러 파일로 나눕니다. 파일은 서버로 전송되지 않습니다.",
        };
      case "compress":
        return {
          title: "Compress PDF",
          subtitle: "용량 줄이기",
          description: "PDF를 최적화해 용량을 줄입니다. 파일은 서버로 전송되지 않습니다.",
        };
    }
  }, [mode]);

  const services = useMemo(
    () =>
      [
        {
          mode: "merge" as const,
          title: "Merge",
          subtitle: "합체",
          description: "여러 PDF를 한 파일로",
          icon: Layers,
        },
        {
          mode: "split" as const,
          title: "Split",
          subtitle: "분할",
          description: "범위/선택/크기로 분리",
          icon: Scissors,
        },
        {
          mode: "compress" as const,
          title: "Compress",
          subtitle: "용량 줄이기",
          description: "최적화로 파일 크기 감소",
          icon: Shrink,
        },
      ] as const,
    [],
  );

  function dateStamp(): string {
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function moveMergeFile(fromIndex: number, toIndex: number) {
    setMergeOutput(null);
    setMergeFiles((prev) => {
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= prev.length ||
        toIndex >= prev.length ||
        fromIndex === toIndex
      ) {
        return prev;
      }
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
  }

  function normalizePdfFilename(name: string, fallback: string): string {
    const trimmed = name.trim();
    const base = trimmed.length > 0 ? trimmed : fallback;
    return base.toLowerCase().endsWith(".pdf") ? base : `${base}.pdf`;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(37,99,235,0.18),rgba(37,99,235,0))]" />

      <header className="w-full border-b border-black/10 bg-white/60 backdrop-blur dark:border-white/10 dark:bg-black/30">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[color:var(--primary)] text-white shadow-sm">
              <Layers className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">PDFService</div>
              <div className="text-xs text-black/60 dark:text-white/60">
                client-side PDF tools
              </div>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-xs text-black/60 dark:text-white/60 sm:flex">
            <span>서버 업로드 없음</span>
            <span className="opacity-30">•</span>
            <span>브라우저에서 즉시 처리</span>
          </div>
        </div>
      </header>

      <main className="w-full">
        <section className="w-full px-4 pt-6 pb-8 sm:px-6 sm:pt-8 sm:pb-10">
          <div className="mx-auto w-full max-w-7xl">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
              <div className="lg:col-span-7">
                <p className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs text-black/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/30 dark:text-white/70">
                  <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--primary)]" />
                  개인정보 보호: 파일은 로컬에서만 처리
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
                  PDF를 더 빠르고 안전하게
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-black/60 dark:text-white/60 sm:text-base">
                  합체·분할·압축을 한 페이지에서 끝내세요. 드래그앤드롭으로
                  바로 시작합니다.
                </p>
                <p className="mt-3 max-w-2xl text-sm text-black/60 dark:text-white/60">
                  문서가 회사/학교 자료라면 더 신경 쓰이죠. 이 앱은 업로드 없이
                  브라우저에서만 처리해, 네트워크 지연과 유출 걱정 없이 작업할 수
                  있어요.
                </p>

                <div className="mt-5 grid max-w-2xl grid-cols-1 gap-2 sm:grid-cols-3">
                  <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-xs text-black/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/30 dark:text-white/70">
                    <ShieldCheck className="h-4 w-4 text-[color:var(--primary)]" />
                    <span>서버 전송 없음</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-xs text-black/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/30 dark:text-white/70">
                    <Zap className="h-4 w-4 text-[color:var(--primary)]" />
                    <span>즉시 처리</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-xs text-black/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/30 dark:text-white/70">
                    <CloudOff className="h-4 w-4 text-[color:var(--primary)]" />
                    <span>한 페이지 내 작업</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="rounded-2xl border border-black/10 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/30">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
                    {services.map((service) => {
                      const Icon = service.icon;
                      const isActive = mode === service.mode;
                      return (
                        <button
                          key={service.mode}
                          type="button"
                          onClick={() => {
                            setErrorMessage("");
                            setMode(service.mode);
                          }}
                          className={[
                            "group flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-all",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--background)]",
                            isActive
                              ? "border-[color:var(--primary)] bg-[color:var(--primary)]/5"
                              : "border-black/10 bg-white hover:border-black/20 hover:bg-black/[0.02] dark:border-white/10 dark:bg-black dark:hover:border-white/20 dark:hover:bg-white/[0.03]",
                          ].join(" ")}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={[
                                "grid h-10 w-10 place-items-center rounded-xl border",
                                isActive
                                  ? "border-[color:var(--primary)] bg-[color:var(--primary)] text-white"
                                  : "border-black/10 bg-black/[0.02] text-black/70 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/80",
                              ].join(" ")}
                            >
                              <Icon className="h-5 w-5" aria-hidden="true" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-baseline gap-2">
                                <div className="truncate text-sm font-semibold tracking-tight">
                                  {service.title}
                                </div>
                                <div className="text-xs text-black/50 dark:text-white/50">
                                  {service.subtitle}
                                </div>
                              </div>
                              <div className="truncate text-xs text-black/60 dark:text-white/60">
                                {service.description}
                              </div>
                            </div>
                          </div>
                          <ArrowRight
                            className={[
                              "h-4 w-4 transition-all",
                              isActive
                                ? "text-[color:var(--primary)]"
                                : "text-black/40 group-hover:text-black/60 dark:text-white/40 dark:group-hover:text-white/70",
                              isActive ? "translate-x-0" : "translate-x-0.5",
                            ].join(" ")}
                            aria-hidden="true"
                          />
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-xs text-black/50 dark:text-white/50">
                    모든 기능은 한 페이지에서 진행됩니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full px-4 pb-12 sm:px-6">
          <div className="mx-auto w-full max-w-7xl">
            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
              <div className="flex flex-col gap-1">
                <div className="flex items-baseline gap-2">
                  <h2 className="text-lg font-semibold">{modeCopy.title}</h2>
                  <span className="text-xs text-black/50 dark:text-white/50">
                    {modeCopy.subtitle}
                  </span>
                </div>
                <p className="text-sm text-black/60 dark:text-white/60">
                  {modeCopy.description}
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                {errorMessage ? (
                  <div
                    role="alert"
                    className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-900 dark:text-yellow-200"
                  >
                    {errorMessage}
                  </div>
                ) : null}

                {hasLargeFile ? (
                  <div
                    role="status"
                    className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-900 dark:text-yellow-200"
                  >
                    50MB 이상의 파일은 처리 시간이 늘어날 수 있어요.
                  </div>
                ) : null}

                {mode === "merge" && hasDuplicateMergeNames ? (
                  <div
                    role="status"
                    className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-900 dark:text-yellow-200"
                  >
                    파일명이 중복되어 목록에서 (2), (3)처럼 표시해요.
                  </div>
                ) : null}

                <PdfDropzone
                  multiple={mode === "merge"}
                  disabled={isProcessing}
                  onError={setErrorMessage}
                  onFiles={(files) => {
                    if (mode === "merge") {
                      setMergeOutput(null);
                      setMergeFiles((prev) => [...prev, ...files]);
                      return;
                    }
                    if (mode === "split") {
                      const file = files[0] ?? null;
                      setSplitFile(file);
                      setSplitOutputs([]);
                      if (!file) {
                        setSplitPageCount(null);
                        setSplitRanges([]);
                        return;
                      }
                      setErrorMessage("");
                      setIsProcessing(true);
                      getPdfPageCount(file)
                        .then((count) => {
                          setSplitPageCount(count);
                          setSplitRanges([{ start: 1, end: count }]);
                        })
                        .catch(() => {
                          setSplitPageCount(null);
                          setSplitRanges([]);
                          setErrorMessage(
                            "페이지 정보를 불러올 수 없어요. 파일이 손상되었거나 암호화된 PDF일 수 있어요.",
                          );
                        })
                        .finally(() => setIsProcessing(false));
                      return;
                    }
                    setCompressFile(files[0] ?? null);
                  }}
                />

                {selectedFiles.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    <div className="rounded-2xl border border-black/10 dark:border-white/10">
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-2xl bg-black/[0.02] px-4 py-3 dark:bg-white/[0.03]">
                        <div className="flex items-center gap-2">
                          <div className="grid h-8 w-8 place-items-center rounded-xl bg-[color:var(--primary)]/10 text-[color:var(--primary)]">
                            <Files className="h-4 w-4" aria-hidden="true" />
                          </div>
                          <div className="flex items-baseline gap-2">
                            <h3 className="text-sm font-semibold">선택된 파일</h3>
                            <span className="rounded-full bg-[color:var(--primary)]/10 px-2 py-0.5 text-xs font-medium text-[color:var(--primary)]">
                              {selectedFiles.length}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="inline-flex h-9 items-center justify-center rounded-full border border-black/15 bg-white px-4 text-sm font-medium hover:bg-black/[0.03] disabled:opacity-50 dark:border-white/20 dark:bg-black dark:hover:bg-white/[0.06]"
                          onClick={() => {
                            setErrorMessage("");
                            setMergeOutput(null);
                            if (mode === "merge") setMergeFiles([]);
                            if (mode === "split") {
                              setSplitFile(null);
                              setSplitPageCount(null);
                              setSplitRanges([]);
                              setSplitOutputs([]);
                            }
                            if (mode === "compress") setCompressFile(null);
                          }}
                          disabled={isProcessing}
                        >
                          비우기
                        </button>
                      </div>

                      <div className="p-4">
                        <ul className="divide-y divide-black/10 overflow-hidden rounded-xl border border-black/10 dark:divide-white/10 dark:border-white/10">
                          {selectedFiles.map((file, index) => (
                            <li
                              key={`${file.name}-${file.size}-${file.lastModified}`}
                              className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div className="min-w-0">
                                <div className="truncate text-sm font-medium">
                                  {mode === "merge"
                                    ? (mergeDisplayNames[index] ?? file.name)
                                    : file.name}
                                </div>
                                <div className="text-xs text-black/60 dark:text-white/60">
                                  {formatBytes(file.size)}
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center justify-end gap-2">
                                {mode === "merge" ? (
                                  <>
                                    <button
                                      type="button"
                                      className="inline-flex h-9 items-center justify-center rounded-full border border-black/15 bg-white px-3 text-sm font-medium hover:bg-black/[0.03] disabled:opacity-50 dark:border-white/20 dark:bg-black dark:hover:bg-white/[0.06]"
                                      onClick={() => moveMergeFile(index, index - 1)}
                                      disabled={isProcessing || index === 0}
                                      aria-label="위로"
                                    >
                                      ↑
                                    </button>
                                    <button
                                      type="button"
                                      className="inline-flex h-9 items-center justify-center rounded-full border border-black/15 bg-white px-3 text-sm font-medium hover:bg-black/[0.03] disabled:opacity-50 dark:border-white/20 dark:bg-black dark:hover:bg-white/[0.06]"
                                      onClick={() => moveMergeFile(index, index + 1)}
                                      disabled={
                                        isProcessing ||
                                        index === selectedFiles.length - 1
                                      }
                                      aria-label="아래로"
                                    >
                                      ↓
                                    </button>
                                    <button
                                      type="button"
                                      className="inline-flex h-9 items-center justify-center rounded-full border border-black/15 bg-white px-4 text-sm font-medium hover:bg-black/[0.03] disabled:opacity-50 dark:border-white/20 dark:bg-black dark:hover:bg-white/[0.06]"
                                      onClick={() => {
                                        setMergeOutput(null);
                                        setMergeFiles((prev) =>
                                          prev.filter((_, i) => i !== index),
                                        );
                                      }}
                                      disabled={isProcessing}
                                    >
                                      제거
                                    </button>
                                  </>
                                ) : null}

                                <button
                                  type="button"
                                  className="inline-flex h-9 items-center justify-center rounded-full border border-black/15 bg-white px-4 text-sm font-medium hover:bg-black/[0.03] disabled:opacity-50 dark:border-white/20 dark:bg-black dark:hover:bg-white/[0.06]"
                                  onClick={() => downloadFile(file)}
                                  disabled={isProcessing}
                                >
                                  원본 다운로드
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>

                        {mode === "merge" ? (
                          <div className="mt-4 flex flex-col gap-3">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <p className="text-xs text-black/50 dark:text-white/50">
                                위/아래 버튼으로 합칠 순서를 바꿀 수 있어요.
                              </p>
                              <button
                                type="button"
                                className="inline-flex h-10 items-center justify-center rounded-full bg-[color:var(--primary)] px-5 text-sm font-medium text-white shadow-sm hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={isProcessing || mergeFiles.length < 2}
                                onClick={async () => {
                                  if (mergeFiles.length < 2) {
                                    setErrorMessage(
                                      "합체하려면 PDF 파일이 최소 2개 필요해요.",
                                    );
                                    return;
                                  }
                                  setErrorMessage("");
                                  setIsProcessing(true);
                                  try {
                                    const bytes = await mergePdfFiles(mergeFiles);
                                    const safeBytes = new Uint8Array(bytes);
                                    const blob = new Blob([safeBytes], {
                                      type: "application/pdf",
                                    });
                                    const filename = `merged_${dateStamp()}.pdf`;
                                    setMergeOutput({ filename, blob });
                                    setMergeOutputName(filename);
                                  } catch {
                                    setErrorMessage(
                                      "합체에 실패했어요. 파일이 손상되었거나 암호화된 PDF일 수 있어요.",
                                    );
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                              >
                                {isProcessing ? "합치는 중..." : "합치기"}
                              </button>
                            </div>

                            {mergeOutput ? (
                              <div className="rounded-2xl border border-[color:var(--primary)]/30 bg-[color:var(--primary)]/5 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2
                                      className="h-5 w-5 text-[color:var(--primary)]"
                                      aria-hidden="true"
                                    />
                                    <div className="text-sm font-semibold">
                                      합쳐진 파일이 준비됐어요
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    className="inline-flex h-9 items-center justify-center rounded-full border border-black/15 bg-white px-4 text-sm font-medium hover:bg-black/[0.03] disabled:opacity-50 dark:border-white/20 dark:bg-black dark:hover:bg-white/[0.06]"
                                    disabled={isProcessing}
                                    onClick={() => setMergeOutput(null)}
                                  >
                                    삭제
                                  </button>
                                </div>

                                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                  <div className="flex-1">
                                    <label className="text-xs text-black/60 dark:text-white/60">
                                      파일명
                                    </label>
                                    <input
                                      value={mergeOutputName}
                                      onChange={(e) => setMergeOutputName(e.target.value)}
                                      disabled={isProcessing}
                                      className="mt-1 h-10 w-full rounded-xl border border-black/15 bg-white px-3 text-sm text-black/80 shadow-sm outline-none focus:border-[color:var(--primary)] dark:border-white/20 dark:bg-black dark:text-white/80"
                                    />
                                    <div className="mt-1 text-xs text-black/50 dark:text-white/50">
                                      {formatBytes(mergeOutput.blob.size)}
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[color:var(--primary)] px-5 text-sm font-medium text-white shadow-sm hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                                    disabled={isProcessing}
                                    onClick={() => {
                                      const filename = normalizePdfFilename(
                                        mergeOutputName,
                                        mergeOutput.filename,
                                      );
                                      downloadFile(
                                        new File([mergeOutput.blob], filename, {
                                          type: mergeOutput.blob.type,
                                        }),
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
                        ) : null}
                      </div>
                    </div>

                    {mode === "split" && splitFile ? (
                      <SplitPanel
                        key={`${splitFile.name}-${splitFile.size}-${splitFile.lastModified}`}
                        file={splitFile}
                        pageCount={splitPageCount}
                        ranges={splitRanges}
                        setRanges={setSplitRanges}
                        outputs={splitOutputs}
                        setOutputs={setSplitOutputs}
                        isProcessing={isProcessing}
                        setIsProcessing={setIsProcessing}
                        setErrorMessage={setErrorMessage}
                        dateStamp={dateStamp}
                      />
                    ) : null}

                    {mode === "compress" && compressFile ? (
                      // Phase 5: compress MVP
                      <CompressPanel
                        key={`${compressFile.name}-${compressFile.size}-${compressFile.lastModified}`}
                        file={compressFile}
                        isProcessing={isProcessing}
                        setIsProcessing={setIsProcessing}
                        setErrorMessage={setErrorMessage}
                        dateStamp={dateStamp}
                      />
                    ) : null}
                  </div>
                ) : (
                  <p className="text-xs text-black/50 dark:text-white/50">
                    {mode === "merge"
                      ? "PDF 2개 이상을 올리면 합칠 수 있어요."
                      : mode === "split"
                        ? "PDF 1개를 올리면 분할 옵션을 설정할 수 있어요."
                        : "PDF 1개를 올리면 압축 옵션을 설정할 수 있어요."}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
