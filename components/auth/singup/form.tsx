"use client";

import * as React from "react";
import Link from "next/link";
import { Mail, Phone, User } from "lucide-react";
import { InputField } from "@/components/ui/shared/input/generic-input";
import { Button } from "@/components/ui/button";

const RegisterForm = () => {
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="w-full max-w-md space-y-5 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
    >
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">
          Create Account
        </h2>
        <p className="text-sm text-muted-foreground">
          Fill in the details to get started
        </p>
      </div>

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

      {/* ── Login Link ── */}
      <p className="text-center text-sm text-muted-foreground">
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
