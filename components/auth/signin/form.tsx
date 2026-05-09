"use client";

import * as React from "react";
import Link from "next/link";
import { Phone } from "lucide-react";
import { InputField } from "@/components/ui/shared/input/generic-input";
import { Button } from "@/components/ui/button";

const LoginForm = () => {
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="w-full max-w-md space-y-5 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
    >
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">Welcome Back</h2>
        <p className="text-sm text-muted-foreground">
          Enter your mobile number to login
        </p>
      </div>

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

      {/* ── Signup Link ── */}
      <p className="text-center text-sm text-muted-foreground">
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
