"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { FormEvent, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Message, SearchParamsMessage } from "@/components/ui/message";

// A separate component to handle the email parameter from searchParams
function EmailProvider({ children }: { children: (email: string | null) => React.ReactNode }) {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  return <>{children(email)}</>;
}

// Create a wrapper for SearchParamsMessage with Suspense
function SearchParamsWrapper() {
  return (
    <Suspense fallback={<div className="w-full h-6"></div>}>
      <SearchParamsMessage />
    </Suspense>
  );
}

export default function VerifyResetCodePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  
  const router = useRouter();
  
  const handleVerificationCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Strip any non-numeric characters and limit to 6 digits
    const cleanedValue = e.target.value.replace(/\D/g, '').substring(0, 6);
    setVerificationCode(cleanedValue);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>, email: string | null) => {
    e.preventDefault();
    
    if (!email) {
      router.push("/forgot-password");
      return;
    }
    
    if (verificationCode.length !== 6) {
      setError("Verification code must be 6 digits");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Submitting reset code verification:", { email, code: verificationCode });
      
      const response = await fetch("/api/auth/verify-reset-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          code: verificationCode.trim(),
        }),
      });
      
      const data = await response.json();
      console.log("Verification response:", data);
      
      if (!response.ok) {
        setError(data.error || "Verification failed. Please try again.");
      } else {
        // If verification was successful, move to password reset
        setVerifiedEmail(data.email);
        setSuccess("Code verified successfully! Redirecting to reset your password...");
        
        // Redirect to reset password page after a brief delay
        setTimeout(() => {
          router.push(`/reset-password?email=${encodeURIComponent(data.email)}&token=${encodeURIComponent(data.token)}`);
        }, 1500);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Verification error:", err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResendCode = async (email: string | null) => {
    if (!email) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/auth/send-reset-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          resendOnly: true,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || "Failed to resend code. Please try again.");
      } else {
        setSuccess("Verification code resent! Please check your email.");
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Resend error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
    </div>}>
      <EmailProvider>
        {(email) => {
          // If there's no email in the URL, redirect to forgot-password
          if (!email && typeof window !== 'undefined') {
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
                    Verify reset code
                  </h2>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    Please enter the verification code sent to {email}
                  </p>
                </div>

                {/* Verification Form */}
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
                  
                  {/* Verification Code Form */}
                  <form className="space-y-6" onSubmit={(e) => handleSubmit(e, email)}>
                    <div>
                      <label 
                        htmlFor="verificationCode" 
                        className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                      >
                        Verification Code
                      </label>
                      <div className="mt-2">
                        <Input
                          id="verificationCode"
                          name="verificationCode"
                          type="text"
                          required
                          className="h-11 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-teal-500 focus:ring-teal-500 dark:text-white text-center tracking-widest text-xl font-medium"
                          placeholder="Enter code"
                          value={verificationCode}
                          onChange={handleVerificationCodeChange}
                          autoFocus
                          inputMode="numeric"
                          maxLength={6}
                        />
                      </div>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Enter the 6-digit verification code we sent to your email
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
                            Verifying...
                          </>
                        ) : (
                          'Verify code'
                        )}
                      </Button>
                    </div>
                  </form>

                  <div className="mt-4 text-center">
                    <button 
                      type="button"
                      className="text-sm text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
                      onClick={() => handleResendCode(email)}
                      disabled={isLoading}
                    >
                      Didn't receive the code? Click to resend
                    </button>
                  </div>

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
      </EmailProvider>
    </Suspense>
  );
} 