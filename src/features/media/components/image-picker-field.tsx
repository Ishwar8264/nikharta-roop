"use client";

import { ImagePlus } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { MediaPickerDialog } from "./media-picker-dialog";

interface ImagePickerFieldProps {
  id: string;
  label: string;
  value?: string | null;
  onChange: (url: string | undefined) => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: string;
}

/** Controlled single-image field, shared by cover and banner form inputs. */
export function ImagePickerField({ id, label, value, onChange, onBlur, disabled, error }: ImagePickerFieldProps) {
  return (
    <div className="space-y-2" onBlur={onBlur}>
      <p id={`${id}-label`} className="text-sm font-medium">{label}</p>
      <div aria-labelledby={`${id}-label`} aria-describedby={error ? `${id}-error` : undefined}>
        <MediaPickerDialog
          title={`Choose ${label.toLowerCase()}`}
          value={value ? [{ url: value, publicId: value }] : []}
          onChange={(next) => onChange(next[0]?.url)}
          mode="single"
          max={1}
          maxSizeMB={5}
          disabled={disabled}
          trigger={
            <div className="relative flex aspect-video flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border border-dashed bg-muted">
              {value ? (
                <Image src={value} alt={label} fill sizes="(max-width: 640px) 100vw, 400px" className="object-cover" />
              ) : (
                <><ImagePlus className="size-5 text-muted-foreground" aria-hidden="true" /><span className="text-sm text-muted-foreground">Choose {label.toLowerCase()}</span></>
              )}
            </div>
          }
        />
      </div>
      {value ? <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => onChange(undefined)}>Remove {label.toLowerCase()}</Button> : null}
      {error ? <p id={`${id}-error`} role="alert" className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
