"use client";

import { CheckCircle2, Loader2, UploadCloud, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { signUpload } from "../actions";
import { saveMedia } from "../actions/save-media";
import { uploadToCloudinary } from "../lib/upload-to-cloudinary";
import type { UploadedImage, UploadTask } from "../types";

interface UploadPaneProps {
  value: UploadedImage[];
  onChange: (next: UploadedImage[]) => void;
  /** Fired after every file in a batch succeeds — used for auto-close. */
  onUploadComplete?: () => void;
  maxFiles?: number;
  maxSizeMB?: number;
  accept?: string[];
  disabled?: boolean;
}

const DEFAULT_ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export function UploadPane({
  value,
  onChange,
  onUploadComplete,
  maxFiles = 10,
  maxSizeMB = 5,
  accept = DEFAULT_ACCEPT,
  disabled,
}: UploadPaneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = maxFiles - value.length;

  const handleFiles = useCallback(
    async (files: File[]) => {
      setError(null);

      const valid = files
        .filter((f) => accept.includes(f.type))
        .filter((f) => f.size <= maxSizeMB * 1024 * 1024)
        .slice(0, remaining);

      if (valid.length === 0) {
        setError(`Up to ${maxFiles} images, ${maxSizeMB}MB each.`);
        return;
      }

      const newTasks: UploadTask[] = valid.map((file) => ({
        id: Math.random().toString(36).slice(2),
        file,
        progress: 0,
        status: "pending",
        previewUrl: URL.createObjectURL(file),
      }));
      setTasks((prev) => [...prev, ...newTasks]);

      const uploaded: UploadedImage[] = [];
      let failures = 0;

      for (const task of newTasks) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id ? { ...t, status: "uploading" } : t,
          ),
        );

        try {
          const signature = await signUpload();
          const result = await uploadToCloudinary({
            file: task.file,
            signature,
            onProgress: (progress) =>
              setTasks((prev) =>
                prev.map((t) => (t.id === task.id ? { ...t, progress } : t)),
              ),
          });

          await saveMedia(result);

          uploaded.push(result);
          setTasks((prev) =>
            prev.map((t) =>
              t.id === task.id
                ? { ...t, status: "done", progress: 100, result }
                : t,
            ),
          );
        } catch (e) {
          failures += 1;
          setTasks((prev) =>
            prev.map((t) =>
              t.id === task.id
                ? {
                    ...t,
                    status: "error",
                    error: e instanceof Error ? e.message : "Upload failed",
                  }
                : t,
            ),
          );
        }
      }

      if (uploaded.length > 0) {
        onChange([...value, ...uploaded]);
      }

      // Auto-close only when the whole batch succeeded.
      if (failures === 0 && uploaded.length > 0) {
        setTimeout(() => {
          setTasks((prev) =>
            prev.filter((t) => !newTasks.some((nt) => nt.id === t.id)),
          );
          onUploadComplete?.();
        }, 700);
      }
    },
    [accept, maxFiles, maxSizeMB, onChange, remaining, value, onUploadComplete],
  );

  const doneCount = tasks.filter((t) => t.status === "done").length;
  const overallProgress =
    tasks.length > 0
      ? Math.round(
          tasks.reduce(
            (sum, t) => sum + (t.status === "done" ? 100 : t.progress),
            0,
          ) / tasks.length,
        )
      : 0;

  const isUploading = tasks.some(
    (t) => t.status === "uploading" || t.status === "pending",
  );

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (disabled) return;
          void handleFiles(Array.from(e.dataTransfer.files));
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/40 hover:bg-muted/30",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <UploadCloud className="h-6 w-6" aria-hidden="true" />
        </span>

        <p className="text-sm font-semibold text-foreground">
          Upload media files
        </p>
        <p className="text-xs text-muted-foreground">
          Drag and drop files here, or click to select files
        </p>
        <p className="text-[11px] text-muted-foreground/80">
          Max {maxFiles} files · Max {maxSizeMB}MB each · JPG, PNG, WebP, AVIF
        </p>

        <input
          ref={inputRef}
          type="file"
          accept={accept.join(",")}
          multiple={maxFiles > 1}
          hidden
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = "";
            void handleFiles(files);
          }}
        />
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      {/* Overall progress — visible while uploading */}
      {isUploading ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">
              Uploading {doneCount}/{tasks.length}
            </span>
            <span className="tabular-nums text-muted-foreground">
              {overallProgress}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-[width] duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      ) : null}

      {/* Per-file list — horizontal progress with % */}
      {tasks.length > 0 ? (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onRemove={() => {
                URL.revokeObjectURL(task.previewUrl);
                setTasks((prev) => prev.filter((t) => t.id !== task.id));
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function TaskRow({
  task,
  onRemove,
}: {
  task: UploadTask;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-2.5">
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={task.previewUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs font-medium text-foreground">
            {task.file.name}
          </p>
          <span className="shrink-0 text-[11px] font-medium tabular-nums text-muted-foreground">
            {task.status === "done" ? "Done" : `${task.progress}%`}
          </span>
        </div>

        {task.status === "error" ? (
          <p className="truncate text-[11px] text-destructive">
            {task.error ?? "Upload failed"}
          </p>
        ) : (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full transition-[width] duration-200",
                task.status === "done" ? "bg-emerald-500" : "bg-primary",
              )}
              style={{ width: `${task.progress}%` }}
            />
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center">
        {task.status === "done" ? (
          <CheckCircle2
            className="h-4 w-4 text-emerald-500"
            aria-hidden="true"
          />
        ) : task.status === "error" ? (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove"
            className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <Loader2
            className="h-4 w-4 animate-spin text-primary"
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}
