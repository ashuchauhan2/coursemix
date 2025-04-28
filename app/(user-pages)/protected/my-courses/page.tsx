import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Course, TermInfo } from "@/types";
import CourseCard from "@/components/my-courses/CourseCard";
import Link from "next/link";
import { getCurrentTerm, getCurrentDateET } from "@/utils/date-utils";

export default async function MyCourses() {
  const supabase = await createClient();

  // Get the user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Get the current term information
  const termInfo: TermInfo = getCurrentTerm();
  const currentYear = new Date(getCurrentDateET()).getFullYear();
  
  // FIXED: We need to match the format in database which is "Winter" not "WINTER"
  // Map the term to the format used in the database
  const termMap: Record<string, string> = {
    'WINTER': 'Winter',
    'FALL': 'Fall',
    'SPRING': 'Spring',
    'SUMMER': 'Summer'
  };
  const currentTerm = termMap[termInfo.term];

  console.log("Querying for term:", currentTerm);

  // Fetch user profile - using user_id to match the dashboard implementation
  const { data: userProfile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!userProfile) {
    return redirect("/protected/profile-setup");
  }
  
  console.log("User profile found:", userProfile ? "yes" : "no");

  // Get active enrollments for this user in the current term
  const { data: enrollments, error: enrollmentsError } = await supabase
    .from("enrollments")
    .select(`
      id,
      course_id,
      term,
      status
    `)
    .eq("user_id", user.id)
    .eq("term", currentTerm)
    .eq("status", "enrolled");

  if (enrollmentsError) {
    console.error("Error fetching enrollments:", enrollmentsError);
  }

  console.log("Enrollments found:", enrollments?.length || 0);
  if (enrollments) {
    console.log("Enrollment details:", JSON.stringify(enrollments.slice(0, 1)));
  }

  // Get course details for each enrollment
  let courses: (Course & { enrollment_id: string })[] = [];
  
  if (enrollments && enrollments.length > 0) {
    const courseIds = enrollments.map((enrollment: { course_id: string }) => enrollment.course_id);
    console.log("Course IDs to fetch:", courseIds);
    
    // FIXED: Only select columns that actually exist in the courses table
    const { data: coursesData, error: coursesError } = await supabase
      .from("courses")
      .select(`
        id,
        course_code,
        course_days,
        class_time,
        class_type,
        instructor
      `)
      .in("id", courseIds);
    
    if (coursesError) {
      console.error("Error fetching courses:", coursesError);
    }
    
    console.log("Courses found:", coursesData?.length || 0);
    
    if (coursesData) {
      // Merge course data with enrollment id
      courses = coursesData.map((course: any) => {
        const enrollment = enrollments.find((e: { course_id: string }) => e.course_id === course.id);
        return {
          ...course,
          enrollment_id: enrollment?.id || ""
        };
      });
    }
  }

  // Get display term for UI (like "Winter 2025")
  const displayTerm = `${currentTerm} ${currentYear}`;

  return (
    <main className="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 min-h-screen py-6">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">My Courses</h1>
          <Link 
            href="/protected/course-registration" 
            className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 transition-colors shadow-sm hover:shadow-md"
          >
            Add Courses
          </Link>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
            {displayTerm} Courses
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Showing all courses you are currently enrolled in.
          </p>
        </div>
        
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} userId={user.id} />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">No Courses Found</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              You are not currently enrolled in any courses for the {displayTerm} term.
            </p>
            <Link 
              href="/protected/course-registration" 
              className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 transition-colors shadow-sm hover:shadow-md"
            >
              Browse Courses
            </Link>
          </div>
        )}
      </div>
    </main>
  );
} 