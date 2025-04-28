"use client";

import { resetPasswordAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { FormEvent } from "react";

export default function ResetPassword() {
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await resetPasswordAction(formData);
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
            Create new password
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Please enter your new password below
          </p>
        </div>

        {/* New Password Form */}
        <div className="mt-8 bg-white dark:bg-gray-800 px-6 py-8 shadow-xl rounded-xl border border-gray-100 dark:border-gray-700">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
              >
                New password
              </label>
              <div className="mt-2">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="h-11 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-teal-500 focus:ring-teal-500 dark:text-white dark:placeholder-gray-400"
                  placeholder="Enter new password"
                />
              </div>
            </div>

            <div>
              <label 
                htmlFor="confirmPassword" 
                className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
              >
                Confirm new password
              </label>
              <div className="mt-2">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="h-11 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-teal-500 focus:ring-teal-500 dark:text-white dark:placeholder-gray-400"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <div>
              <Button 
                type="submit" 
                className="w-full h-11 bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white transition-colors"
              >
                Reset password
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
                  className="w-full h-11 border-gray-200 dark:border-gray-700 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors dark:text-gray-100"
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
