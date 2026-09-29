"use client";

import type { Content } from "@tiptap/react";
import { Loader2 } from "lucide-react";
import { useCallback } from "react";

import { cn } from "@/lib/utils";
import { MinimalTiptapEditor } from "../ui/minimal-tiptap";

type EditorOutput = "html" | "json" | "text" | "markdown";

interface RichTextEditorProps {
  /** Controlled value. Format must match `output`. */
  value: string;
  /** Fires with the editor's serialized output on every change. */
  onChange: (value: string) => void;
  /** Serialization format. Defaults to "html". */
  output?: EditorOutput;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  isLoading?: boolean;
  className?: string;
  contentClassName?: string;
  /** Notify parent with character count (post-serialization). */
  onCharacterCountChange?: (count: number) => void;
}

/**
 * Shared rich-text editor.
 *
 * Why we coerce `Content` to string on the way out:
 * MinimalTiptapEditor widens its onChange to `string | JSONContent | null`
 * because the underlying Tiptap API returns ProseMirror JSON when
 * `output="json"`. Our consumers store a single primitive in RHF, so we
 * normalize to string here — empty null becomes "".
 *
 * Why the value is stringified on the way in:
 * Same reason. RHF holds a primitive; passing null to the editor would
 * clear it on every keystroke.
 */
export function RichTextEditor({
  value,
  onChange,
  output = "html",
  placeholder,
  disabled,
  autoFocus,
  isLoading,
  className,
  contentClassName,
  onCharacterCountChange,
}: RichTextEditorProps) {
  const handleChange = useCallback(
    (next: Content) => {
      const serialized =
        typeof next === "string"
          ? next
          : next === null
            ? ""
            : JSON.stringify(next);

      onChange(serialized);
      onCharacterCountChange?.(serialized.length);
    },
    [onChange, onCharacterCountChange],
  );

  if (isLoading) {
    return (
      <div
        className={cn(
          "flex min-h-48 items-center justify-center rounded-md border border-border bg-muted/20",
          className,
        )}
      >
        <Loader2
          className="h-5 w-5 animate-spin text-muted-foreground"
          aria-hidden="true"
        />
      </div>
    );
  }

  return (
    <MinimalTiptapEditor
      value={value || ""}
      onChange={handleChange}
      output={output}
      placeholder={placeholder}
      editable={!disabled}
      autofocus={autoFocus}
      className={cn(
        "w-full rounded-md border border-border bg-background",
        "focus-within:border-ring focus-within:ring-3 focus-within:ring/20",
        disabled && "pointer-events-none opacity-60",
        className,
      )}
      editorContentClassName={cn("p-4", contentClassName)}
    />
  );
}
