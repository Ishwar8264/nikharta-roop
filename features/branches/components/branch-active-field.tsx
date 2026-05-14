import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type BranchActiveFieldProps = {
  onChange: (value: boolean) => void;
  value: boolean;
};

// Keeps the active/inactive toggle visually consistent across forms.
export function BranchActiveField({ onChange, value }: BranchActiveFieldProps) {
  return (
    <Label className="justify-between rounded-xl border bg-white p-3">
      <span>
        <span className="block">Active branch</span>
        <span className="text-xs font-normal text-muted-foreground">
          Active branches appear on public booking and discovery screens.
        </span>
      </span>
      <Switch
        checked={value}
        name="isActive"
        onCheckedChange={(checked) => onChange(checked)}
      />
    </Label>
  );
}
