import { AuthPageShell } from "@/components/auth/auth-ui";
import { LoginForm } from "@/components/auth/signin/form";

const SignInPage = () => {
  return (
    <AuthPageShell>
      <LoginForm />
    </AuthPageShell>
  );
};

export default SignInPage;
