"use client";

import Link from "next/link";
import { Phone } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-orange-50 px-4 py-12">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="w-20 h-20 bg-gradient-to-r from-rose-500 to-orange-500 rounded-2xl mx-auto flex items-center justify-center mb-4">
            <Phone className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-2xl tracking-tight">
            नया अकाउंट बनाएं
          </CardTitle>
          <CardDescription>मोबाइल नंबर से OTP verify करें</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SignupForm />
          <div className="text-center text-sm text-stone-500 pt-4">
            पहले से अकाउंट है?{" "}
            <Link
              href="/login"
              className="font-medium text-rose-600 hover:text-rose-700"
            >
              लॉगिन करें
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
