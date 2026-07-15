import { AuthFlow } from "@/src/components/auth/shared/auth-flow";
import { AuthPageHeader } from "@/src/components/auth/shared/auth-page-header";
import { getAuthFlowCopy } from "@/src/components/auth/utils/auth-flow";

// Receive server-known delivery capability without exposing environment variables.
type RegisterFormProps = {
  mobileAvailable: boolean;
};

// Compose server-rendered signup copy with the narrow interactive auth flow.
export function RegisterForm({ mobileAvailable }: RegisterFormProps) {
  // Build static signup copy on the server for the first HTML response.
  const copy = getAuthFlowCopy("SIGNUP", mobileAvailable);

  // Pass serializable configuration and server-rendered children to the client island.
  return (
    <AuthFlow mobileAvailable={mobileAvailable} purpose="SIGNUP">
      <AuthPageHeader
        description={copy.description}
        headingId="signup-heading"
        title={copy.title}
      />
    </AuthFlow>
  );
}
