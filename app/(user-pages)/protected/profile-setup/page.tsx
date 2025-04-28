import React from "react";
import { createClient } from "../../../../utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Metadata } from "next";

// Let Next.js infer the proper types by itself - no explicit type definitions
export default async function ProfileSetupPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const supabase = await createClient();

  // Get the authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Check if user already has a profile
  const { data: existingProfile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // If user already has a profile and setup is complete, redirect to dashboard
  if (existingProfile && existingProfile.is_profile_setup) {
    return redirect("/protected/dashboard");
  }

  // Fetch all programs for the dropdown
  const { data: programs } = await supabase
    .from("programs")
    .select("id, program_name")
    .order("program_name");

  // Handle form submission
  const createProfile = async (formData: FormData) => {
    "use server";
    
    const firstName = formData.get("first_name") as string;
    const lastName = formData.get("last_name") as string;
    const studentNumber = formData.get("student_number") as string;
    const programId = parseInt(formData.get("program_id") as string);
    const targetAverage = parseInt(formData.get("target_average") as string) || null;
    const universityStartDate = formData.get("university_start_date") as string;

    if (!firstName || !lastName || !studentNumber || !programId) {
      return redirect("/protected/profile-setup?message=All fields except Target Average and University Start Date are required");
    }

    // Create Supabase client inside the server action
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return redirect("/sign-in");
    }

    // Check if the student number is already in use
    const { data: existingStudentNumber } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("student_number", studentNumber)
      .maybeSingle();

    if (existingStudentNumber) {
      return redirect("/protected/profile-setup?message=This student number is already registered. Please use a different number or contact support.");
    }

    // Properly format the date for PostgreSQL timestamptz
    let formattedStartDate = null;
    if (universityStartDate) {
      // Ensure the date is stored as UTC midnight to preserve the exact date
      const [year, month, day] = universityStartDate.split('-').map(Number);
      const utcDate = new Date(Date.UTC(year, month - 1, day));
      formattedStartDate = utcDate.toISOString();
    }

    // Create new user profile in the database
    const { error } = await supabase
      .from("user_profiles")
      .insert({
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        student_number: studentNumber,
        program_id: programId,
        target_average: targetAverage,
        university_start_date: formattedStartDate,
        is_profile_setup: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error("Error creating profile:", error);
      return redirect(`/protected/profile-setup?message=${encodeURIComponent(error.message)}`);
    }

    // Revalidate the profile page to refresh the data
    revalidatePath("/protected/profile");
    
    return redirect("/protected/dashboard");
  };

  return (
    <main className="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 min-h-screen py-10">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="flex flex-col items-center justify-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400">
            Complete Your Profile
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl text-center">
            Please provide your information to complete your account setup
          </p>
        </div>

        {searchParams?.message && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-6">
            {searchParams.message}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <form action={createProfile}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Name *
                  </label>
                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Name *
                  </label>
                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="student_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Student Number *
                  </label>
                  <input
                    id="student_number"
                    name="student_number"
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Your unique student ID number. This must be unique across all users.
                  </p>
                </div>

                <div>
                  <label htmlFor="program_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Program *
                  </label>
                  <select
                    id="program_id"
                    name="program_id"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select a program</option>
                    {programs?.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.program_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="target_average" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Target Average
                  </label>
                  <input
                    id="target_average"
                    name="target_average"
                    type="number"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Optional: Your target GPA for your academic journey
                  </p>
                </div>

                <div>
                  <label htmlFor="university_start_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    University Start Date
                  </label>
                  <input
                    id="university_start_date"
                    name="university_start_date"
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Optional: When you started your university journey
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="submit"
                  className="w-full bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white font-medium py-3 px-4 rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Complete Profile Setup
                </button>
                <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-4">
                  * Required fields
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
} 