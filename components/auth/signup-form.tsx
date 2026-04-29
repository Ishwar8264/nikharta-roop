"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface SignupFormProps {
  onSuccess?: (mobile: string) => void;
}

export function SignupForm({ onSuccess }: SignupFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const isMobileValid = mobile.length === 10 && mobile.match(/^[6-9]\d{9}$/);

  const handleSubmit = async (formData: FormData) => {
    if (!isMobileValid) {
      toast.error("कृपया सही 10-अंकीय मोबाइल नंबर डालें (6-9 से शुरू)");
      return;
    }

    startTransition(async () => {
      const input = {
        mobile: formData.get("mobile") as string,
        name: (formData.get("name") as string) || undefined,
        email: (formData.get("email") as string) || undefined,
      };

      try {
        const response = await fetch("/api/v1/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });

        const data = await response.json();

        if (data.success) {
          toast.success(data.message || "OTP भेज दिया गया है!");
          setMobile("");
          setName("");
          setEmail("");
          if (onSuccess) {
            onSuccess(input.mobile);
          } else {
            router.push(
              `/verify-otp?mobile=${encodeURIComponent(input.mobile)}`,
            );
          }
        } else {
          toast.error(data.message || "रजिस्ट्रेशन असफल। फिर कोशिश करें।");
        }
      } catch {
        toast.error("नेटवर्क त्रुटि। कृपया फिर से प्रयास करें।");
      }
    });
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="mobile">
          मोबाइल नंबर <span className="text-rose-600">*</span>
        </Label>
        <Input
          id="mobile"
          name="mobile"
          type="tel"
          inputMode="tel"
          maxLength={10}
          pattern="[6-9][0-9]{9}"
          placeholder="98xxxxxxxx"
          value={mobile}
          onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
          className={cn("w-full", !mobile && "placeholder:text-stone-400")}
          required
          disabled={isPending}
        />
        <p className="text-xs text-stone-500">10 अंक (6-9 से शुरू)</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">नाम (वैकल्पिक)</Label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="अपना नाम डालें"
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">ईमेल (वैकल्पिक)</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@email.com"
          disabled={isPending}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isPending || !isMobileValid}
      >
        {isPending ? "भेज रहे हैं..." : "OTP भेजें"}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </form>
  );
}
