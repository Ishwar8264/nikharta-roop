"use client";

import { UploadCloud } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { signUpload } from "../actions";
import { saveMedia } from "../actions/save-media";
import { uploadToCloudinary } from "../lib/upload-to-cloudinary";
import type { UploadedImage, UploadTask } from "../types";

interface UploadPaneProps {
  value: UploadedImage[];
  onChange: (next: UploadedImage[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  accept?: string[];
  disabled?: boolean;
}

const DEFAULT_ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/**
 * Upload tab — dropzone plus progress list.
 *
 * Why serial uploads:
 * Parallel uploads saturate the connection pool and every progress bar
 * crawls. One at a time completes images in the order the user added them.
 *
 * Why the parent owns `value` (finished URLs) but not tasks:
 * The parent only cares about the payload it will submit. Progress, previews
 * and per-file errors are transient UI state — hoisting them would force
 * every consumer form to carry upload bookkeeping it does not use.
 */
export function UploadPane({
  value,
  onChange,
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

      let signature;
      try {
        signature = await signUpload();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not start upload");
        return;
      }

      const uploaded: UploadedImage[] = [];

      for (const task of newTasks) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id ? { ...t, status: "uploading" } : t,
          ),
        );

        try {
          const result = await uploadToCloudinary({
            file: task.file,
            signature,
            onProgress: (progress) =>
              setTasks((prev) =>
                prev.map((t) => (t.id === task.id ? { ...t, progress } : t)),
              ),
          });

          // Persist to our DB so it appears in the library tab.
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
    },
    [accept, maxFiles, maxSizeMB, onChange, remaining, value],
  );

  return (
    <div className="space-y-4">
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
          Supports: IMAGE · Max {maxFiles} files · Max {maxSizeMB}MB each
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

      {tasks.length > 0 ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {tasks.map((task) => (
            <TaskTile
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

function TaskTile({
  task,
  onRemove,
}: {
  task: UploadTask;
  onRemove: () => void;
}) {
  return (
    <div className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={task.previewUrl}
        alt=""
        className="h-full w-full object-cover"
      />

      {task.status === "uploading" || task.status === "pending" ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-background/70 backdrop-blur-sm">
          <span className="text-[11px] font-semibold text-foreground">
            {task.progress}%
          </span>
          <div className="h-1 w-12 overflow-hidden rounded-full bg-border">
            <div
              className="h-full bg-primary transition-[width] duration-200"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
      ) : null}

      {task.status === "error" ? (
        <div className="absolute inset-0 flex items-center justify-center bg-destructive/80 p-2 text-center text-[10px] font-medium text-destructive-foreground">
          {task.error ?? "Failed"}
        </div>
      ) : null}

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        aria-label="Remove"
        className="absolute right-1 top-1 h-6 w-6 rounded-full bg-background/90 opacity-0 group-hover:opacity-100"
      >
        ×
      </Button>
    </div>
  );
}
