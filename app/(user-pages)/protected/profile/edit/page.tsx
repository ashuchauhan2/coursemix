import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export default async function EditProfilePage({
  searchParams,
}: {
  searchParams: { message?: string; success?: string };
}) {
  const supabase = await createClient();

  // Get the user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch user profile
  const { data: userProfile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!userProfile) {
    return redirect("/protected/profile-setup");
  }

  // Fetch all programs for the dropdown
  const { data: programs } = await supabase
    .from("programs")
    .select("id, program_name")
    .order("program_name");

  // Handle form submission
  const updateProfile = async (formData: FormData) => {
    "use server";
    
    const firstName = formData.get("first_name") as string;
    const lastName = formData.get("last_name") as string;
    const studentNumber = formData.get("student_number") as string;
    const programId = parseInt(formData.get("program_id") as string);
    const targetAverage = parseInt(formData.get("target_average") as string);
    const universityStartDate = formData.get("university_start_date") as string;

    if (!firstName || !lastName || !studentNumber || !programId) {
      return redirect("/protected/profile/edit?message=All fields are required");
    }

    // Create Supabase client inside the server action
    const supabase = await createClient();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return redirect("/sign-in");
    }

    // Fetch the current user profile to check if program changed
    const { data: currentProfile } = await supabase
      .from("user_profiles")
      .select("program_id")
      .eq("user_id", user.id)
      .single();

    const programChanged = currentProfile && currentProfile.program_id !== programId;

    // Properly format the date for PostgreSQL timestamptz
    let formattedStartDate = null;
    if (universityStartDate) {
      // Ensure the date is stored as UTC midnight to preserve the exact date
      const [year, month, day] = universityStartDate.split('-').map(Number);
      const utcDate = new Date(Date.UTC(year, month - 1, day));
      formattedStartDate = utcDate.toISOString();
    }

    // Update user profile in the database
    const { error } = await supabase
      .from("user_profiles")
      .update({
        first_name: firstName,
        last_name: lastName,
        student_number: studentNumber,
        program_id: programId,
        target_average: targetAverage || null,
        university_start_date: formattedStartDate,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (error) {
      console.error("Error updating profile:", error);
      return redirect(`/protected/profile/edit?message=${encodeURIComponent(error.message)}`);
    }

    // If program changed, delete all grades for this user
    if (programChanged) {
      const { error: deleteError } = await supabase
        .from("student_grades")
        .delete()
        .eq("user_id", user.id);

      if (deleteError) {
        console.error("Error deleting grades:", deleteError);
        return redirect(`/protected/profile?success=Profile updated successfully, but there was an error clearing your grades data.`);
      }
    }

    // Revalidate the profile page to refresh the data
    revalidatePath("/protected/profile");
    
    return redirect(`/protected/profile?success=${programChanged 
      ? "Profile updated successfully. Your grades have been cleared because you changed your program." 
      : "Profile updated successfully"}`);
  };

  return (
    <main className="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 min-h-screen py-10">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="flex flex-col items-center justify-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400">
            Edit Profile
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl text-center">
            Update your personal and academic information
          </p>
        </div>

        {searchParams?.message && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-6">
            {searchParams.message}
          </div>
        )}

        {searchParams?.success && (
          <div className="bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded mb-6">
            {searchParams.success}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <form action={updateProfile}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Name
                  </label>
                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    required
                    defaultValue={userProfile.first_name}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Name
                  </label>
                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    required
                    defaultValue={userProfile.last_name}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="student_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Student Number
                  </label>
                  <input
                    id="student_number"
                    name="student_number"
                    type="text"
                    required
                    defaultValue={userProfile.student_number}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="program_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Program
                  </label>
                  <div className="mb-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-3 text-sm text-amber-700 dark:text-amber-300">
                    <div className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500 dark:text-amber-400 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>
                        <strong>Warning:</strong> Changing your program will delete all your existing grades. You will need to re-enter them after changing programs.
                      </span>
                    </div>
                  </div>
                  <select
                    id="program_id"
                    name="program_id"
                    required
                    defaultValue={userProfile.program_id}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent"
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
                    defaultValue={userProfile.target_average || ""}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="university_start_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    University Start Date
                  </label>
                  <input
                    id="university_start_date"
                    name="university_start_date"
                    type="date"
                    defaultValue={userProfile.university_start_date ? new Date(userProfile.university_start_date).toISOString().split('T')[0] : ""}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    When you started your university journey
                  </p>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <Link href="/protected/profile">
                  <button 
                    type="button"
                    className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-2 px-4 rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    Cancel
                  </button>
                </Link>
                <button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white font-medium py-2 px-4 rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
} 