import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/utils/date-utils";

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function ProfilePage(props: PageProps) {
  // Access searchParams safely
  let successMessage: string | null = null;
  
  // Check if props and searchParams exist before trying to access
  if (props && 'searchParams' in props) {
    const searchParamsObj = await Promise.resolve(props.searchParams);
    successMessage = typeof searchParamsObj.success === 'string' 
      ? searchParamsObj.success 
      : Array.isArray(searchParamsObj.success) && searchParamsObj.success.length > 0
        ? searchParamsObj.success[0]
        : null;
  }
  
  const supabase = await createClient();

  // Get the user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch user profile
  const { data: userProfile, error: profileError } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!userProfile) {
    return redirect("/protected/profile-setup");
  }

  // Fetch program information
  const { data: program } = await supabase
    .from("programs")
    .select("*")
    .eq("id", userProfile.program_id)
    .single();

  return (
    <main className="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 min-h-screen py-10">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex flex-col items-center justify-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400">
            Your Profile
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl text-center">
            Manage your personal and academic information
          </p>
        </div>

        {successMessage && (
          <div className="bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded mb-6">
            {successMessage}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-teal-500/10 to-emerald-500/10 dark:from-teal-500/5 dark:to-emerald-500/5 p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-500 dark:to-emerald-500 w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {userProfile.first_name?.[0]}{userProfile.last_name?.[0]}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {userProfile.first_name} {userProfile.last_name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-1">
                  Student ID: {userProfile.student_number}
                </p>
                <p className="text-gray-600 dark:text-gray-400 mb-1">
                  Program: {program?.program_name || "Not specified"}
                </p>
                <p className="text-teal-600 dark:text-teal-400 font-medium">
                  Target Average: {userProfile.target_average || "Not set"}
                </p>
                {userProfile.university_start_date && (
                  <p className="text-gray-600 dark:text-gray-400 mb-1">
                    Started: {formatDate(userProfile.university_start_date)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Profile Details</h3>
              <Link href="/protected/profile/edit">
                <button className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white font-medium py-2 px-4 rounded-md transition-all duration-200 shadow-sm hover:shadow-md">
                  Edit Profile
                </button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">First Name</h4>
                <p className="text-gray-800 dark:text-gray-200">{userProfile.first_name}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Last Name</h4>
                <p className="text-gray-800 dark:text-gray-200">{userProfile.last_name}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Student Number</h4>
                <p className="text-gray-800 dark:text-gray-200">{userProfile.student_number}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Program</h4>
                <p className="text-gray-800 dark:text-gray-200">{program?.program_name || "Not specified"}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Target Average</h4>
                <p className="text-gray-800 dark:text-gray-200">{userProfile.target_average || "Not set"}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">University Start Date</h4>
                <p className="text-gray-800 dark:text-gray-200">
                  {userProfile.university_start_date ? formatDate(userProfile.university_start_date) : "Not set"}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Account Created</h4>
                <p className="text-gray-800 dark:text-gray-200">{formatDate(userProfile.created_at)}</p>
              </div>
            </div>
            
            <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Account Management</h3>
              
              <div className="flex flex-wrap gap-4">
                <Link href="/protected/reset-password">
                  <button className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-2 px-4 rounded-md transition-all duration-200 shadow-sm hover:shadow-md">
                    Change Password
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 