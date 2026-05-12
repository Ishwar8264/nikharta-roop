import { VerifyOtpForm } from "@/components/auth/otp/form";
import React from "react";

const VerifyRegisterPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ devOtp?: string; mobile?: string }>;
}) => {
  // The previous Server Action sends mobile/devOtp in the URL so this page can
  // render as a Server Component while the OTP form stays interactive.
  const { devOtp, mobile = "" } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <VerifyOtpForm
        mode="signup"
        title="Verify Registration"
        subtitle="Enter the OTP to complete your account setup"
        submitButtonLabel="Verify & Register"
        defaultMobile={mobile}
        devOtp={devOtp}
        disableMobile
      />
    </div>
  );
};

export default VerifyRegisterPage;
