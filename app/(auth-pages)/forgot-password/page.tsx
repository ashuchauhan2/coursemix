"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Message, SearchParamsMessage } from "@/components/ui/message";

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email")?.toString() || "";
    
    // Validation
    if (!email) {
      setError("Email is required");
      setIsLoading(false);
      return;
    }
    
    try {
      // Send request to our API to trigger password reset verification
      const response = await fetch("/api/auth/send-reset-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || "Something went wrong. Please try again.");
      } else {
        setSuccess("Reset code sent! Redirecting to verification page...");
        // Redirect to verification page after a brief delay
        setTimeout(() => {
          router.push(`/verify-reset-code?email=${encodeURIComponent(email)}`);
        }, 1500);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Password reset error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 px-4 py-8">
      <div className="w-full max-w-md space-y-8">
        {/* Logo/Brand Section */}
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Course Mix
          </h1>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Reset your password
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Enter your email address and we'll send you a verification code to reset your password
          </p>
        </div>

        {/* Reset Password Form */}
        <div className="mt-8 bg-white dark:bg-gray-800 px-6 py-8 shadow-xl rounded-xl border border-gray-100 dark:border-gray-700">
          <SearchParamsMessage />
          
          {error && (
            <Message
              type="error"
              message={error}
              onDismiss={() => setError(null)}
            />
          )}
          
          {success && (
            <Message
              type="success"
              message={success}
              onDismiss={() => setSuccess(null)}
            />
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
              >
                Email address
              </label>
              <div className="mt-2">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="h-11 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-teal-500 focus:ring-teal-500 dark:text-white"
                  placeholder="Enter your email"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                We'll send a verification code to this email
              </p>
            </div>

            <div>
              <Button 
                type="submit" 
                className="w-full h-11 bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white transition-colors disabled:opacity-70"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending code...
                  </>
                ) : (
                  'Send reset code'
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">
                  Remember your password?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link href="/sign-in" className="w-full block">
                <Button 
                  variant="outline" 
                  className="w-full h-11 border-gray-200 dark:border-gray-700 hover:border-teal-500 hover:text-teal-600 dark:text-gray-100 dark:hover:text-teal-400 transition-colors"
                >
                  Back to sign in
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
