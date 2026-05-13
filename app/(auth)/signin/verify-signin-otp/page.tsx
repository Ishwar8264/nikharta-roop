import { VerifyOtpForm } from "@/components/auth/otp/form";
import React from "react";

const VerifyLoginPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ devOtp?: string; identifier?: string; mobile?: string }>;
}) => {
  // The previous Server Action sends identifier/devOtp in the URL so this page can
  // render as a Server Component while the OTP form stays interactive.
  const { devOtp, identifier, mobile = "" } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <VerifyOtpForm
        mode="signin"
        title="Verify Login"
        subtitle="Enter the OTP sent to your mobile or email to login"
        submitButtonLabel="Verify & Login"
        defaultIdentifier={identifier ?? mobile}
        defaultMobile={mobile}
        devOtp={devOtp}
        disableMobile
      />
    </div>
  );
};

export default VerifyLoginPage;
