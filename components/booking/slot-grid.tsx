import { Button } from "@/components/ui/button";

type Slot = {
  start: string;
  end: string;
  available: boolean;
};

type SlotGridProps = {
  slots: Slot[];
  selectedSlot?: string;
  onSelect?: (slot: Slot) => void;
};

export function SlotGrid({ slots, selectedSlot, onSelect }: SlotGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {slots.map((slot) => (
        <Button
          disabled={!slot.available}
          key={`${slot.start}-${slot.end}`}
          onClick={() => onSelect?.(slot)}
          type="button"
          variant={selectedSlot === slot.start ? "default" : "outline"}
        >
          {slot.start}
        </Button>
      ))}
    </div>
  );
}
