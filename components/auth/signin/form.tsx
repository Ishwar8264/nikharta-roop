"use client";

import * as React from "react";
import Link from "next/link";
import { Phone } from "lucide-react";
import { InputField } from "@/components/ui/shared/input/generic-input";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/shared/logo/logo";

const LoginForm = () => {
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      /* Reduced top padding (pt-6 instead of p-8), kept sides/bottom same */
      className="w-full max-w-md rounded-2xl border border-gray-200 bg-white px-8 pt-6 pb-8 shadow-sm"
    >
      {/* ── Logo & Header grouped tightly ── */}
      <div className="flex flex-col items-center space-y-2">
        <Logo size="lg" />{" "}
        {/* Change to size="md" if you want it even tighter */}
        <div className="text-center">
          <h2 className="text-xl font-semibold tracking-tight">Welcome Back</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your mobile number to login
          </p>
        </div>
      </div>

      {/* ── Form Fields ── */}
      <div className="mt-6 space-y-5">
        {/* ── Mobile ── */}
        <InputField
          label="Mobile Number"
          placeholder="9876543210"
          type="tel"
          autoComplete="tel"
          required
          leftIcon={<Phone className="h-4 w-4" />}
          helperText="10-digit Indian mobile number"
        />

        {/* ── Submit ── */}
        <Button type="submit" className="w-full">
          Login
        </Button>
      </div>

      {/* ── Signup Link ── */}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&lsquo;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Register
        </Link>
      </p>
    </form>
  );
};

LoginForm.displayName = "LoginForm";

export { LoginForm };
