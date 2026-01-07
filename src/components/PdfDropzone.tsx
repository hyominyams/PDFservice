"use client";

import { useCallback } from "react";
import { type FileRejection, useDropzone } from "react-dropzone";

type PdfDropzoneProps = {
  multiple: boolean;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
  onError?: (message: string) => void;
};

export function PdfDropzone({
  multiple,
  disabled,
  onFiles,
  onError,
}: PdfDropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (fileRejections.length > 0) {
        onError?.("PDF 파일만 업로드할 수 있어요.");
      }
      if (acceptedFiles.length > 0) {
        onError?.("");
        onFiles(acceptedFiles);
      }
    },
    [onError, onFiles],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple,
    disabled,
    noClick: true,
    noKeyboard: true,
  });

  return (
    <div
      {...getRootProps({
        className: [
          "rounded-xl border border-dashed px-4 py-10 text-center text-sm",
          "transition-colors",
          disabled ? "opacity-60" : "",
          isDragActive
            ? "border-[color:var(--primary)] bg-[color:var(--primary)]/5"
            : "border-black/20 bg-black/[0.02] dark:border-white/20 dark:bg-white/[0.03]",
        ].join(" "),
      })}
      aria-label="PDF 업로드"
    >
      <input {...getInputProps()} />
      <div className="mx-auto flex max-w-md flex-col items-center gap-3">
        <p className="text-black/70 dark:text-white/70">
          {isDragActive
            ? "여기에 놓으면 업로드돼요"
            : "PDF를 여기에 끌어놓거나 파일 선택을 눌러주세요"}
        </p>
        <button
          type="button"
          className="inline-flex h-10 items-center justify-center rounded-full bg-[color:var(--primary)] px-5 text-sm font-medium text-white hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--background)] disabled:cursor-not-allowed"
          onClick={open}
          disabled={disabled}
        >
          파일 선택
        </button>
        <p className="text-xs text-black/50 dark:text-white/50">
          {multiple ? "여러 파일 선택 가능" : "1개 파일만 선택 가능"}
        </p>
      </div>
    </div>
  );
}
