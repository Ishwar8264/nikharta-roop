import { VerifyOtpForm } from "@/components/auth/otp/form";
import React from "react";

const VerifyRegisterPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <VerifyOtpForm
        title="Verify Registration"
        subtitle="Enter the OTP to complete your account setup"
        submitButtonLabel="Verify & Register"
        defaultMobile="9876543210"
        disableMobile
      />
    </div>
  );
};

export default VerifyRegisterPage;
