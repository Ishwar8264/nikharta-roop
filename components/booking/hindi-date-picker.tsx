"use client";

import { Calendar } from "@/components/ui/calendar";

type HindiDatePickerProps = {
  date?: Date;
  onSelect?: (date?: Date) => void;
};

export function HindiDatePicker({ date, onSelect }: HindiDatePickerProps) {
  return <Calendar mode="single" selected={date} onSelect={onSelect} className="rounded-md border" />;
}
