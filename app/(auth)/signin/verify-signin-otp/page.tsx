import { VerifyOtpForm } from "@/components/auth/otp/form";
import React from "react";

const VerifyLoginPage = async ({
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
        mode="signin"
        title="Verify Login"
        subtitle="Enter the OTP sent to your mobile to login"
        submitButtonLabel="Verify & Login"
        defaultMobile={mobile}
        devOtp={devOtp}
        disableMobile
      />
    </div>
  );
};

export default VerifyLoginPage;
