"use client";

import type { Content, Editor } from "@tiptap/react";
import { Loader2 } from "lucide-react";
import { useCallback } from "react";

import dynamic from "next/dynamic";

import { cn } from "@/lib/utils";
import { MinimalTiptapEditor } from "../ui/minimal-tiptap";

const DescriptionWritingDialog = dynamic(() => import("./description-writing-dialog").then((m) => m.DescriptionWritingDialog));

type EditorOutput = "html" | "json" | "text" | "markdown";

export interface RichTextEditorOutputs {
  text: string;
  html: string;
  json: string;
}

interface RichTextEditorProps {
  variant?: "default" | "compact";
  aiContext?: string;
  /** Controlled value. Format must match `output`. */
  value: string;
  /** Fires with the editor's serialized output on every change. */
  onChange: (value: string) => void;
  /** Receives all persisted representations from the same editor state. */
  onOutputsChange?: (outputs: RichTextEditorOutputs) => void;
  onBlur?: () => void;
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
  variant = "default",
  aiContext,
  value,
  onChange,
  onOutputsChange,
  onBlur,
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
    (next: Content, editor: Editor) => {
      const serialized =
        typeof next === "string"
          ? next
          : next === null
            ? ""
            : JSON.stringify(next);

      onChange(serialized);
      const isEmpty = editor.isEmpty;
      onOutputsChange?.({
        text: isEmpty ? "" : editor.getText(),
        html: isEmpty ? "" : editor.getHTML(),
        json: isEmpty ? "" : JSON.stringify(editor.getJSON()),
      });
      onCharacterCountChange?.(serialized.length);
    },
    [onChange, onCharacterCountChange, onOutputsChange],
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
      variant={variant}
      renderToolbarAction={aiContext !== undefined ? (editor) => (
        <DescriptionWritingDialog editor={editor} context={aiContext} disabled={disabled} />
      ) : undefined}
      value={value || ""}
      onChange={handleChange}
      onBlur={onBlur}
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
      editorContentClassName={cn(variant === "default" && "p-4", contentClassName)}
    />
  );
}
