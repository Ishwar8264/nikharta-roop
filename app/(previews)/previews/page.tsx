import { InputField } from "@/components/ui/shared/input/generic-input";
import { Lock, Mail, Phone } from "lucide-react";

const PreviewsPage = () => {
  return (
    <div className="max-w-2xl mx-auto ">
      <form className="space-y-4">
        <InputField
          label="Email Address"
          type="email"
          required
          leftIcon={<Mail className="h-4 w-4" />}
          placeholder="you@example.com"
          helperText="We'll never share your email"
        />

        <InputField
          label="Password"
          type="password"
          required
          showPasswordToggle
          leftIcon={<Lock className="h-4 w-4" />}
          //   error={errors.password}
          inputClassName="font-mono"
        />

        <InputField
          label="Phone Number"
          type="tel"
          leftIcon={<Phone className="h-4 w-4" />}
          success="Phone number verified"
          containerClassName="col-span-2"
          className="rounded-sm py-4"
        />
      </form>
    </div>
  );
};

export default PreviewsPage;
