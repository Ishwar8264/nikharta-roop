import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export function OtpInput({ value, onChange }: OtpInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="otp">OTP दर्ज करें</Label>
      <Input
        id="otp"
        inputMode="numeric"
        maxLength={6}
        onChange={(event) => onChange(event.target.value)}
        placeholder="6 अंकों का OTP"
        value={value}
      />
    </div>
  );
}
