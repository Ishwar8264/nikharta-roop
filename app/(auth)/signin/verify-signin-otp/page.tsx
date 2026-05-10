import { VerifyOtpForm } from "@/components/auth/otp/form";
import React from "react";

const VerifyLoginPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <VerifyOtpForm
        title="Verify Login"
        subtitle="Enter the OTP sent to your mobile to login"
        submitButtonLabel="Verify & Login"
        defaultMobile="9876543210"
        disableMobile
      />
    </div>
  );
};

export default VerifyLoginPage;
