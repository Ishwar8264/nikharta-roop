"use client";

import { Save } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

type BranchSubmitButtonProps = {
  disabled?: boolean;
  label: string;
};

// Uses native form pending state for create and edit screens.
export function BranchSubmitButton({ disabled, label }: BranchSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending || disabled} type="submit">
      <Save className="size-4" />
      {pending ? "Saving..." : label}
    </Button>
  );
}
