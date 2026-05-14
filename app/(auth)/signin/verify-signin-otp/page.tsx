import { AuthPageShell } from "@/components/auth/auth-ui";
import { VerifyOtpForm } from "@/components/auth/otp/form";

const VerifyLoginPage = async ({
  searchParams,
}: {
  searchParams: Promise<{
    devOtp?: string;
    identifier?: string;
    mobile?: string;
    retryAfter?: string;
  }>;
}) => {
  // The previous Server Action sends identifier/devOtp in the URL so this page can
  // render as a Server Component while the OTP form stays interactive.
  const { devOtp, identifier, mobile = "", retryAfter } = await searchParams;

  return (
    <AuthPageShell>
      <VerifyOtpForm
        mode="signin"
        title="Verify Login"
        subtitle="Enter the OTP sent to your mobile or email to login"
        submitButtonLabel="Verify & Login"
        defaultIdentifier={identifier ?? mobile}
        defaultMobile={mobile}
        devOtp={devOtp}
        disableMobile
        initialRetryAfter={Number(retryAfter ?? 0)}
      />
    </AuthPageShell>
  );
};

export default VerifyLoginPage;
