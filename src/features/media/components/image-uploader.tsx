"use client";

import { ImagePlus, Loader2, UploadCloud, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { saveMedia } from "../actions/save-media";
import { signUpload } from "../actions/sign-upload";
import { uploadToCloudinary } from "../lib/upload-to-cloudinary";
import type { UploadedImage, UploadTask } from "../types";

interface ImageUploaderProps {
  value: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  /** Maximum number of images, including any already in `value`. */
  maxFiles?: number;
  /** Max size per file in MB. */
  maxSizeMB?: number;
  /** Accepted MIME types. */
  accept?: string[];
  disabled?: boolean;
  className?: string;
}

const DEFAULT_ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/** Small id generator — no dependency, no crypto cost. */
function makeId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * Drag-and-drop image uploader with real progress and previews.
 *
 * Why drag & drop AND a picker:
 * Desktop users expect to drop; mobile users cannot. One hidden
 * `<input type="file">` gives us both — the dropzone forwards clicks to it,
 * and the OS picker is exactly the same UI on mobile.
 *
 * Why uploads run one at a time:
 * Firing 10 parallel XHRs saturates the connection pool and makes every
 * progress bar crawl. A serial queue completes images in the order the user
 * added them, which matches how they mentally review a gallery.
 *
 * Why the parent owns `value` but not in-flight tasks:
 * The parent only cares about finished URLs — the payload it will submit.
 * Progress, previews, and errors are transient UI state and would pollute
 * the form if the parent had to hold them too.
 */
export function ImageUploader({
  value,
  onChange,
  maxFiles = 10,
  maxSizeMB = 5,
  accept = DEFAULT_ACCEPT,
  disabled,
  className,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const remaining =
    maxFiles - value.length - tasks.filter((t) => t.status !== "error").length;

  /** Validates a batch and returns the files that pass. */
  const filterFiles = useCallback(
    (files: File[]): File[] => {
      const accepted: File[] = [];
      for (const file of files) {
        if (!accept.includes(file.type)) continue;
        if (file.size > maxSizeMB * 1024 * 1024) continue;
        accepted.push(file);
      }
      return accepted.slice(0, remaining);
    },
    [accept, maxSizeMB, remaining],
  );

  const handleFiles = useCallback(
    async (files: File[]) => {
      setGlobalError(null);
      const valid = filterFiles(files);

      if (valid.length === 0) {
        setGlobalError(
          `Please choose up to ${maxFiles} images under ${maxSizeMB}MB.`,
        );
        return;
      }

      // Optimistically add tasks so the UI reacts immediately.
      const newTasks: UploadTask[] = valid.map((file) => ({
        id: makeId(),
        file,
        progress: 0,
        status: "pending",
        previewUrl: URL.createObjectURL(file),
      }));
      setTasks((prev) => [...prev, ...newTasks]);

      // Serial upload — see component doc for why.
      const completed = [...value];
      for (const task of newTasks) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id ? { ...t, status: "uploading" } : t,
          ),
        );

        try {
          // Each file gets its own signed public ID, so uploads cannot
          // overwrite one another or escape the current user's namespace.
          const signature = await signUpload();
          const result = await uploadToCloudinary({
            file: task.file,
            signature,
            onProgress: (progress) => {
              setTasks((prev) =>
                prev.map((t) => (t.id === task.id ? { ...t, progress } : t)),
              );
            },
          });
          await saveMedia(result);

          URL.revokeObjectURL(task.previewUrl);
          setTasks((prev) => prev.filter((item) => item.id !== task.id));

          // Notify the parent only after the asset is fully stored.
          completed.push(result);
          onChange([...completed]);
        } catch (error) {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === task.id
                ? {
                    ...t,
                    status: "error",
                    error:
                      error instanceof Error ? error.message : "Upload failed",
                  }
                : t,
            ),
          );
        }
      }
    },
    [filterFiles, maxFiles, maxSizeMB, onChange, value],
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const files = Array.from(e.dataTransfer.files);
    void handleFiles(files);
  }

  function handleRemoveTask(taskId: string) {
    setTasks((prev) => {
      const task = prev.find((t) => t.id === taskId);
      if (task) URL.revokeObjectURL(task.previewUrl);
      return prev.filter((t) => t.id !== taskId);
    });
  }

  function handleRemoveUploaded(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  const atLimit = remaining <= 0;

  return (
    <div className={cn("space-y-4", className)}>
      {/* ─── Dropzone ─── */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !atLimit) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => {
          if (!disabled && !atLimit) inputRef.current?.click();
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!disabled && !atLimit) inputRef.current?.click();
          }
        }}
        aria-disabled={disabled || atLimit}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/40 hover:bg-muted/30",
          (disabled || atLimit) &&
            "pointer-events-none cursor-not-allowed opacity-50",
        )}
      >
        <span
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
            isDragging
              ? "bg-primary/15 text-primary"
              : "bg-muted text-muted-foreground",
          )}
        >
          <UploadCloud className="h-6 w-6" aria-hidden="true" />
        </span>

        <div>
          <p className="text-sm font-medium text-foreground">
            {atLimit
              ? `Maximum ${maxFiles} images reached`
              : isDragging
                ? "Drop images here"
                : "Drag & drop images, or click to browse"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Up to {maxFiles} images · {maxSizeMB}MB each · JPG, PNG, WebP, AVIF
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={accept.join(",")}
          multiple
          hidden
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = ""; // allow re-selecting the same file
            void handleFiles(files);
          }}
        />
      </div>

      {/* ─── Global error ─── */}
      {globalError ? (
        <p className="text-xs text-destructive">{globalError}</p>
      ) : null}

      {/* ─── Preview grid ─── */}
      {(value.length > 0 || tasks.length > 0) && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {value.map((image, index) => (
            <div
              key={image.publicId}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
            >
              <Image
                src={image.url}
                alt=""
                fill
                sizes="200px"
                className="object-cover"
              />
              {!disabled ? (
                <button
                  type="button"
                  onClick={() => handleRemoveUploaded(index)}
                  aria-label="Remove image"
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 shadow-sm transition-opacity hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              ) : null}
            </div>
          ))}

          {tasks.map((task) => (
            <div
              key={task.id}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={task.previewUrl}
                alt=""
                className="h-full w-full object-cover"
              />

              {/* Overlay: progress / spinner / error */}
              {task.status === "uploading" || task.status === "pending" ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/70 backdrop-blur-sm">
                  <Loader2
                    className="h-5 w-5 animate-spin text-primary"
                    aria-hidden="true"
                  />
                  <span className="text-xs font-medium text-foreground">
                    {task.progress}%
                  </span>
                  <div className="h-1 w-16 overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full bg-primary transition-[width] duration-200"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                </div>
              ) : null}

              {task.status === "error" ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-destructive/80 p-2 text-center text-[10px] font-medium text-destructive-foreground backdrop-blur-sm">
                  <ImagePlus className="h-4 w-4" aria-hidden="true" />
                  <span className="line-clamp-2">{task.error ?? "Failed"}</span>
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => handleRemoveTask(task.id)}
                aria-label="Remove upload"
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 shadow-sm transition-opacity hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
