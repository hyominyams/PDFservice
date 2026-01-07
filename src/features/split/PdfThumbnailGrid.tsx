"use client";

import { cn } from "@/lib/utils";
import { getPdfJs, pdfJsAssetUrls } from "@/lib/pdfjs";
import type { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";
import { useEffect, useMemo, useRef, useState } from "react";

type PdfThumbnailGridProps = {
  file: File;
  pageCount: number;
  selectedPages: Set<number>; // 1-based
  onTogglePage: (pageNumber: number) => void;
  onSelectAll: () => void;
  onClear: () => void;
  disabled?: boolean;
};

export function PdfThumbnailGrid({
  file,
  pageCount,
  selectedPages,
  onTogglePage,
  onSelectAll,
  onClear,
  disabled,
}: PdfThumbnailGridProps) {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [loadingError, setLoadingError] = useState<string>("");
  const pdfDocRef = useRef<PDFDocumentProxy | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const pdfjs = await getPdfJs();
        const buffer = await file.arrayBuffer();
        const task = pdfjs.getDocument({ data: buffer, ...pdfJsAssetUrls });
        const doc = await task.promise;
        if (cancelled) {
          doc.destroy();
          return;
        }
        const typed = doc as unknown as PDFDocumentProxy;
        pdfDocRef.current = typed;
        setPdfDoc(typed);
      } catch (err) {
        if (!cancelled) {
          console.error("PDF.js load failed", err);
          setLoadingError(
            err instanceof Error
              ? `미리보기를 불러올 수 없어요: ${err.message}`
              : "미리보기를 불러올 수 없어요. 파일이 손상되었거나 암호화된 PDF일 수 있어요.",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      pdfDocRef.current?.destroy();
      pdfDocRef.current = null;
    };
  }, [file]);

  const pages = useMemo(
    () => Array.from({ length: pageCount }, (_, i) => i + 1),
    [pageCount],
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-black/60 dark:text-white/60">
          페이지를 클릭해서 선택하세요.
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-8 items-center justify-center rounded-full border border-black/15 bg-white px-3 text-xs font-medium hover:bg-black/[0.03] disabled:opacity-50 dark:border-white/20 dark:bg-black dark:hover:bg-white/[0.06]"
            disabled={disabled}
            onClick={onSelectAll}
          >
            전체 선택
          </button>
          <button
            type="button"
            className="inline-flex h-8 items-center justify-center rounded-full border border-black/15 bg-white px-3 text-xs font-medium hover:bg-black/[0.03] disabled:opacity-50 dark:border-white/20 dark:bg-black dark:hover:bg-white/[0.06]"
            disabled={disabled}
            onClick={onClear}
          >
            선택 해제
          </button>
        </div>
      </div>

      {loadingError ? (
        <div
          role="alert"
          className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-900 dark:text-yellow-200"
        >
          {loadingError}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {pages.map((pageNumber) => {
          const selected = selectedPages.has(pageNumber);
          if (loadingError) {
            return (
              <button
                key={pageNumber}
                type="button"
                disabled={disabled}
                onClick={() => onTogglePage(pageNumber)}
                className={cn(
                  "flex items-center justify-between rounded-xl border px-3 py-3 text-left transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--background)]",
                  selected
                    ? "border-[color:var(--primary)] bg-[color:var(--primary)]/5"
                    : "border-black/10 bg-white hover:border-black/25 dark:border-white/10 dark:bg-black dark:hover:border-white/25",
                )}
                aria-pressed={selected}
                aria-label={`페이지 ${pageNumber} ${selected ? "선택됨" : "선택 안 됨"}`}
              >
                <div className="text-sm font-semibold">p.{pageNumber}</div>
                <div
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-medium",
                    selected
                      ? "bg-[color:var(--primary)] text-white"
                      : "bg-black/[0.04] text-black/70 dark:bg-white/[0.06] dark:text-white/70",
                  )}
                >
                  {selected ? "선택됨" : "선택"}
                </div>
              </button>
            );
          }

          return (
            <PdfThumbnailItem
              key={pageNumber}
              pdfDoc={pdfDoc}
              pageNumber={pageNumber}
              selected={selected}
              onToggle={() => onTogglePage(pageNumber)}
              disabled={disabled || !pdfDoc}
            />
          );
        })}
      </div>
    </div>
  );
}

type PdfThumbnailItemProps = {
  pdfDoc: PDFDocumentProxy | null;
  pageNumber: number;
  selected: boolean;
  onToggle: () => void;
  disabled?: boolean;
};

function PdfThumbnailItem({
  pdfDoc,
  pageNumber,
  selected,
  onToggle,
  disabled,
}: PdfThumbnailItemProps) {
  const ref = useRef<HTMLButtonElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setIsVisible(true);
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!pdfDoc || !isVisible || thumbnailUrl) return;

    (async () => {
      try {
        const page = await pdfDoc.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 0.25 });
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const context = canvas.getContext("2d");
        if (!context) return;

        const renderTask = page.render({ canvasContext: context, viewport, canvas });
        await renderTask.promise;

        const blob: Blob | null = await new Promise((resolve) =>
          canvas.toBlob((b) => resolve(b), "image/webp", 0.8),
        );
        if (!blob || cancelled) return;

        const url = URL.createObjectURL(blob);
        urlRef.current = url;
        setThumbnailUrl(url);
      } catch {
        // ignore thumbnail render failures (keep placeholder)
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isVisible, pageNumber, pdfDoc, thumbnailUrl]);

  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "group relative overflow-hidden rounded-xl border text-left transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--background)]",
        disabled ? "opacity-60" : "hover:border-black/25 dark:hover:border-white/25",
        selected
          ? "border-[color:var(--primary)] bg-[color:var(--primary)]/5"
          : "border-black/10 bg-white dark:border-white/10 dark:bg-black",
      )}
      aria-pressed={selected}
      aria-label={`페이지 ${pageNumber} ${selected ? "선택됨" : "선택 안 됨"}`}
    >
      <div className="aspect-[3/4] w-full bg-black/[0.03] dark:bg-white/[0.05]">
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={`페이지 ${pageNumber} 썸네일`}
            src={thumbnailUrl}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-black/40 dark:text-white/40">
            {disabled ? "로딩 중..." : "미리보기"}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <div className="text-xs font-medium">p.{pageNumber}</div>
        <div
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-medium",
            selected
              ? "bg-[color:var(--primary)] text-white"
              : "bg-black/[0.04] text-black/70 dark:bg-white/[0.06] dark:text-white/70",
          )}
        >
          {selected ? "선택됨" : "선택"}
        </div>
      </div>
    </button>
  );
}
