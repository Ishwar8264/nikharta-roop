import { Button } from "@/components/ui/button";

type StarRatingProps = {
  value: number;
  onChange?: (value: number) => void;
};

export function StarRating({ value, onChange }: StarRatingProps) {
  return (
    <div className="flex gap-1" aria-label={`${value} star rating`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Button key={star} onClick={() => onChange?.(star)} size="icon" type="button" variant="ghost">
          <span className={star <= value ? "text-amber-500" : "text-muted-foreground"}>★</span>
        </Button>
      ))}
    </div>
  );
}
