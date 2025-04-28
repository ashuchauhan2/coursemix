"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { FormEvent, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Message, SearchParamsMessage } from "@/components/ui/message";

// A wrapper component to handle search params
function ResetParamsProvider({ 
  children 
}: { 
  children: (email: string | null, token: string | null) => React.ReactNode 
}) {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const token = searchParams.get("token");
  return <>{children(email, token)}</>;
}

// Create a wrapper for SearchParamsMessage with Suspense
function SearchParamsWrapper() {
  return (
    <Suspense fallback={<div className="w-full h-6"></div>}>
      <SearchParamsMessage />
    </Suspense>
  );
}

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const router = useRouter();
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>, email: string | null, token: string | null) => {
    e.preventDefault();
    
    if (!email || !token) {
      router.push("/forgot-password");
      return;
    }
    
    // Validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Resetting password");
      
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          token: token.trim(),
          password,
        }),
      });
      
      const data = await response.json();
      console.log("Password reset response:", data);
      
      if (!response.ok) {
        setError(data.error || "Failed to reset password. Please try again.");
      } else {
        setSuccess("Password reset successfully! Redirecting to login...");
        // Redirect to sign-in after a short delay
        setTimeout(() => {
          router.push("/sign-in");
        }, 2000);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Password reset error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
    </div>}>
      <ResetParamsProvider>
        {(email, token) => {
          // If email or token is missing, redirect to forgot-password
          if ((!email || !token) && typeof window !== 'undefined') {
            router.push("/forgot-password");
            return <Loader2 className="h-8 w-8 animate-spin text-teal-600" />;
          }
          
          return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 px-4 py-8">
              <div className="w-full max-w-md space-y-8">
                {/* Logo/Brand Section */}
                <div className="text-center">
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                    Course Mix
                  </h1>
                  <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                    Create new password
                  </h2>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    Enter a new password for your account
                  </p>
                </div>

                {/* Password Reset Form */}
                <div className="mt-8 bg-white dark:bg-gray-800 px-6 py-8 shadow-xl rounded-xl border border-gray-100 dark:border-gray-700">
                  <SearchParamsWrapper />
                  
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
                  
                  {/* Password Form */}
                  <form className="space-y-6" onSubmit={(e) => handleSubmit(e, email, token)}>
                    <div>
                      <label 
                        htmlFor="password" 
                        className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                      >
                        New Password
                      </label>
                      <div className="mt-2">
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          required
                          className="h-11 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-teal-500 focus:ring-teal-500 dark:text-white"
                          placeholder="Create a password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoFocus
                          minLength={8}
                        />
                      </div>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Must be at least 8 characters
                      </p>
                    </div>
                    
                    <div>
                      <label 
                        htmlFor="confirmPassword" 
                        className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                      >
                        Confirm Password
                      </label>
                      <div className="mt-2">
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          required
                          className="h-11 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-teal-500 focus:ring-teal-500 dark:text-white"
                          placeholder="Confirm your password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          minLength={8}
                        />
                      </div>
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
                            Resetting password...
                          </>
                        ) : (
                          'Reset Password'
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
        }}
      </ResetParamsProvider>
    </Suspense>
  );
} 