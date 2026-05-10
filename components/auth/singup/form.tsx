"use client";

import * as React from "react";
import Link from "next/link";
import { Mail, Phone, User } from "lucide-react";
import { InputField } from "@/components/ui/shared/input/generic-input";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/shared/logo/logo";

const RegisterForm = () => {
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="w-full max-w-md rounded-2xl border border-gray-200 bg-white px-8 pt-6 pb-8 shadow-sm"
    >
      {/* ── Logo & Header grouped tightly ── */}
      <div className="flex flex-col items-center space-y-2">
        <Logo size="lg" />

        <div className="text-center">
          <h2 className="text-xl font-semibold tracking-tight">
            Create Account
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Fill in the details to get started
          </p>
        </div>
      </div>

      {/* ── Form Fields ── */}
      <div className="mt-6 space-y-5">
        {/* ── Name ── */}
        <InputField
          label="Name"
          placeholder="Enter your name"
          type="text"
          autoComplete="name"
          leftIcon={<User className="h-4 w-4" />}
          helperText="2–100 characters"
        />

        {/* ── Email ── */}
        <InputField
          label="Email"
          placeholder="you@example.com"
          type="email"
          autoComplete="email"
          leftIcon={<Mail className="h-4 w-4" />}
          helperText="Optional — but we'll send updates here"
        />

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
          Register
        </Button>
      </div>

      {/* ── Login Link ── */}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/signin"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Login
        </Link>
      </p>
    </form>
  );
};

RegisterForm.displayName = "RegisterForm";

export { RegisterForm };
