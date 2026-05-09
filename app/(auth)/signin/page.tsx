import { LoginForm } from "@/components/auth/signin/form";
import React from "react";

const SignInPage = () => {
  return (
    <div>
      <div className="min-h-screen flex items-center justify-center p-4">
        <LoginForm />
      </div>
    </div>
  );
};

export default SignInPage;
