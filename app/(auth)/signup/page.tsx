import { AuthPageShell } from "@/components/auth/auth-ui";
import { RegisterForm } from "@/components/auth/singup/form";

const SignUpPage = () => {
  return (
    <AuthPageShell>
      <RegisterForm />
    </AuthPageShell>
  );
};

export default SignUpPage;
