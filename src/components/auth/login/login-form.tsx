import { AuthFlow } from "@/src/components/auth/shared/auth-flow";
import { AuthPageHeader } from "@/src/components/auth/shared/auth-page-header";
import { getAuthFlowCopy } from "@/src/components/auth/utils/auth-flow";

// Receive server-known delivery capability without exposing environment variables.
type LoginFormProps = {
  mobileAvailable: boolean;
};

// Compose server-rendered login copy with the narrow interactive auth flow.
export function LoginForm({ mobileAvailable }: LoginFormProps) {
  // Build static login copy on the server for the first HTML response.
  const copy = getAuthFlowCopy("LOGIN", mobileAvailable);

  // Pass serializable configuration and server-rendered children to the client island.
  return (
    <AuthFlow mobileAvailable={mobileAvailable} purpose="LOGIN">
      <AuthPageHeader
        description={copy.description}
        headingId="login-heading"
        title={copy.title}
      />
    </AuthFlow>
  );
}
