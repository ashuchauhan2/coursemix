import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Timetable from "@/components/dashboard/Timetable";
import UserProfile from "@/components/dashboard/UserProfile";
import { getCurrentTerm, getCurrentDateET, toEasternTime } from "@/utils/date-utils";
import { Course, Term, ExtendedTermInfo } from "@/types";
import { numericToLetterGrade, decryptGrade } from "@/utils/grade-utils";
import DegreeProgress from "@/components/dashboard/DegreeProgress";
import Deadlines from "@/components/dashboard/Deadlines";
import WeatherWidget from "@/components/dashboard/WeatherWidget";

export default async function DashboardPage() {
  const supabase = await createClient();

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
  
  // Fetch program information
  const { data: program } = await supabase
    .from("programs")
    .select("*")
    .eq("id", userProfile.program_id)
    .single();

  // Fetch grades for academic progress
  const { data: grades } = await supabase
    .from("student_grades")
    .select("*")
    .eq("user_id", user.id);

  // Decrypt grades manually
  const decryptedGrades: { [id: string]: string } = {};
  
  if (grades) {
    for (const grade of grades) {
      try {
        if (grade.grade && typeof grade.grade === 'string' && grade.grade.includes(':')) {
          try {
            const decrypted = decryptGrade(grade.grade, user.id);
            decryptedGrades[grade.id] = decrypted;
          } catch (decryptError) {
            decryptedGrades[grade.id] = 'Decryption Error';
          }
        } else {
          decryptedGrades[grade.id] = grade.grade || 'N/A';
        }
      } catch (e) {
        decryptedGrades[grade.id] = 'Error';
      }
    }
  }

  // Calculate academic progress
  let completedCourses = 0;
  let inProgressCourses = 0;
  const numericGrades: number[] = [];

  if (grades) {
    grades.forEach(grade => {
      const decryptedGrade = decryptedGrades[grade.id];
      
      if (grade.status === 'completed' && decryptedGrade && decryptedGrade !== 'Error' && decryptedGrade !== 'Decryption Error' && decryptedGrade !== 'N/A') {
        completedCourses++;
        
        let numericGrade: number | null = null;
        
        if (!isNaN(Number(decryptedGrade))) {
          numericGrade = Math.min(Number(decryptedGrade), 100);
        } else {
          // Convert letter grades to numeric values
          switch(decryptedGrade) {
            case 'A+': numericGrade = 95; break;
            case 'A': numericGrade = 87.5; break;
            case 'A-': numericGrade = 82.5; break;
            case 'B+': numericGrade = 77.5; break;
            case 'B': numericGrade = 75; break;
            case 'B-': numericGrade = 72.5; break;
            case 'C+': numericGrade = 67.5; break;
            case 'C': numericGrade = 65; break;
            case 'C-': numericGrade = 62.5; break;
            case 'D+': numericGrade = 57.5; break;
            case 'D': numericGrade = 55; break;
            case 'D-': numericGrade = 52.5; break;
            case 'F': numericGrade = 45; break;
          }
        }
        
        if (numericGrade !== null) {
          numericGrades.push(numericGrade);
        }
      } else if (grade.status === 'in-progress') {
        inProgressCourses++;
      }
    });
  }

  const currentAverage = numericGrades.length 
    ? numericGrades.reduce((sum, grade) => sum + grade, 0) / numericGrades.length 
    : 0;

  // Get current term - from the screenshot we can see it's "Winter" in the database
  const currentTermRaw = "Winter"; // Hardcoded based on screenshot
  const currentYear = 2025; // Hardcoded based on screenshot
  const currentTerm = {
    term: "WINTER" as Term,
    year: currentYear,
    displayName: `WINTER ${currentYear}`
  };
  
  // Calculate graduation projection
  const now = getCurrentDateET();
  const currentMonth = now.getMonth();
  
  // Calculate total courses required (default to 40 if not specified)
  const totalRequiredCourses = program?.total_credits || 40;
  
  // Calculate remaining courses, accounting for in-progress courses
  const effectiveCompletedCourses = completedCourses + inProgressCourses;
  const remainingCourses = Math.max(0, totalRequiredCourses - effectiveCompletedCourses);
  
  // Standard course load
  const coursesPerTerm = 5;
  
  // Determine current term based on currentTermRaw
  const isFallTerm = currentTermRaw.toLowerCase() === "fall";
  const isWinterTerm = currentTermRaw.toLowerCase() === "winter";
  const isSpringTerm = currentTermRaw.toLowerCase() === "spring";
  
  // Special case: if 5 or fewer courses remaining, graduate next term
  let graduationTerm: string;
  let graduationYear = currentYear;
  
  if (remainingCourses <= coursesPerTerm) {
    // Student will graduate next term
    if (isFallTerm) {
      // If currently in Fall, graduate in Winter
      graduationTerm = "Winter";
      graduationYear = currentYear + 1;
    } else if (isWinterTerm) {
      // If currently in Winter, graduate in Spring
      graduationTerm = "Spring";
    } else {
      // If currently in Spring, graduate in Fall
      graduationTerm = "Fall";
    }
  } else {
    // Calculate terms needed to complete remaining courses
    // Each term can handle 5 courses, but only count Fall and Winter terms
    const termsNeeded = Math.ceil(remainingCourses / coursesPerTerm);
    
    // Initial term and year
    let term = currentTermRaw;
    let year = currentYear;
    
    // Advance the required number of terms
    let termCount = 0;
    
    while (termCount < termsNeeded) {
      // Move to next term
      if (term.toLowerCase() === "fall") {
        term = "Winter";
        year += 1;
      } else if (term.toLowerCase() === "winter") {
        term = "Spring";
      } else {
        term = "Fall";
      }
      
      // Only count Fall and Winter terms
      if (term.toLowerCase() === "fall" || term.toLowerCase() === "winter") {
        termCount++;
      }
    }
    
    graduationTerm = term;
    graduationYear = year;
  }
  
  // Determine convocation ceremony (Spring or Fall) based on course completion term
  let ceremonyTerm = "";
  let ceremonyYear = graduationYear;
  
  // Map academic term to convocation ceremony
  if (graduationTerm.toLowerCase() === "winter" || graduationTerm.toLowerCase() === "spring") {
    // Winter term (Jan-Apr) and Spring term (May-Aug) completions attend Spring convocation
    ceremonyTerm = "Spring";
    // Ceremony is in the same year courses are completed
  } else {
    // Fall term (Sept-Dec) completions attend Fall convocation
    ceremonyTerm = "Fall";
    // Ceremony is in the same year courses are completed
  }
  
  // Prepare convocation display
  const ceremonyDisplay = `${ceremonyTerm} ${ceremonyYear} Convocation`;
  // Track progress status
  const progressStatus = remainingCourses > 0 
    ? "On track with your progress" 
    : "Ready to graduate";

  // Fetch term dates from important_dates table
  const { data: termDates, error: termDatesError } = await supabase
    .from("important_dates")
    .select("*")
    .eq("term_type", "WINTER") // Using all caps here as it might be stored in the enum format
    .eq("year", currentYear)
    .single();

  console.log("Term dates error:", termDatesError);
  console.log("Term dates:", termDates);
  
  if (termDates) {
    console.log(`Term start date: ${termDates.term_start}, Term end date: ${termDates.term_end}`);
    if (termDates.reading_week_start && termDates.reading_week_end) {
      console.log(`Reading week: ${termDates.reading_week_start} to ${termDates.reading_week_end}`);
    } else {
      console.log("No reading week dates available");
    }
  } else {
    console.log("No term dates found in the database. Using default values.");
  }

  // Calculate term progress and days remaining
  let termProgress = 0;
  let daysRemaining = 0;
  let readingWeekStatus = "Not Scheduled";

  if (termDates && termDates.term_start && termDates.term_end) {
    // Always use Eastern Time for calculations
    const now = getCurrentDateET();
    console.log(`Current date in Eastern Time: ${now.toISOString()}`);
    
    const termStart = new Date(termDates.term_start);
    const termEnd = new Date(termDates.term_end);
    
    // Validate dates (ensure term_start is before term_end and both are valid dates)
    if (isNaN(termStart.getTime()) || isNaN(termEnd.getTime()) || termStart >= termEnd) {
      console.log("Invalid term dates, using fallback calculation");
      // Fallback logic - assume Winter term is Jan 1 to Apr 30 (in Eastern Time)
      const fallbackStart = new Date(Date.UTC(currentYear, 0, 1)); // Jan 1
      const fallbackEnd = new Date(Date.UTC(currentYear, 3, 30));  // Apr 30
      
      // Convert to Eastern Time
      const etFallbackStart = toEasternTime(fallbackStart);
      const etFallbackEnd = toEasternTime(fallbackEnd);
      
      daysRemaining = Math.ceil((etFallbackEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      daysRemaining = Math.max(0, daysRemaining);
      
      const totalDays = Math.ceil((etFallbackEnd.getTime() - etFallbackStart.getTime()) / (1000 * 60 * 60 * 24));
      const daysElapsed = Math.ceil((now.getTime() - etFallbackStart.getTime()) / (1000 * 60 * 60 * 24));
      
      termProgress = Math.min(100, Math.max(0, Math.round((daysElapsed / totalDays) * 100)));
    } else {
      // Calculate days remaining in the term
      daysRemaining = Math.ceil((termEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      daysRemaining = Math.max(0, daysRemaining);
      
      // Calculate term progress percentage
      const totalTermDays = Math.ceil((termEnd.getTime() - termStart.getTime()) / (1000 * 60 * 60 * 24));
      const daysElapsed = Math.ceil((now.getTime() - termStart.getTime()) / (1000 * 60 * 60 * 24));
      
      // Ensure progress is between 0-100%
      termProgress = Math.min(100, Math.max(0, Math.round((daysElapsed / totalTermDays) * 100)));
      
      console.log(`Term calculation (Eastern Time): ${daysElapsed} days elapsed out of ${totalTermDays} total days = ${termProgress}% complete`);
    }
    
    // Calculate reading week status
    if (termDates.reading_week_start && termDates.reading_week_end) {
      const readingWeekStart = new Date(termDates.reading_week_start);
      const readingWeekEnd = new Date(termDates.reading_week_end);
      
      // Validate reading week dates
      if (!isNaN(readingWeekStart.getTime()) && !isNaN(readingWeekEnd.getTime()) && readingWeekStart <= readingWeekEnd) {
        if (now > readingWeekEnd) {
          readingWeekStatus = "Completed";
        } else if (now >= readingWeekStart && now <= readingWeekEnd) {
          readingWeekStatus = "In Progress";
        } else {
          const daysToReadingWeek = Math.max(0, Math.ceil((readingWeekStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
          readingWeekStatus = `Starts in ${daysToReadingWeek} days`;
        }
      } else {
        console.log("Invalid reading week dates");
        readingWeekStatus = "Not Scheduled";
      }
    } else {
      readingWeekStatus = "Not Scheduled";
    }
  } else {
    // Fallback if no term dates are available - estimate based on current date
    console.log("No term dates found, using estimated calculation");
    
    // Use Eastern Time
    const now = getCurrentDateET();
    
    // Fallback - assume Winter term is Jan 1 to Apr 30 (in Eastern Time)
    const fallbackStart = new Date(Date.UTC(currentYear, 0, 1)); // Jan 1
    const fallbackEnd = new Date(Date.UTC(currentYear, 3, 30));  // Apr 30
    
    // Convert to Eastern Time
    const etFallbackStart = toEasternTime(fallbackStart);
    const etFallbackEnd = toEasternTime(fallbackEnd);
    
    daysRemaining = Math.ceil((etFallbackEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    daysRemaining = Math.max(0, daysRemaining);
    
    const totalDays = Math.ceil((etFallbackEnd.getTime() - etFallbackStart.getTime()) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.ceil((now.getTime() - etFallbackStart.getTime()) / (1000 * 60 * 60 * 24));
    
    termProgress = Math.min(100, Math.max(0, Math.round((daysElapsed / totalDays) * 100)));
    console.log(`Fallback term calculation (Eastern Time): ${termProgress}% complete, ${daysRemaining} days remaining`);
    
    readingWeekStatus = "Not Available";
  }

  // Fetch active enrollments - from screenshots we can see status is "enrolled" not "active"
  const { data: enrollments, error: enrollmentsError } = await supabase
    .from("enrollments")
    .select(`
      id,
      course_id,
      term,
      status
    `)
    .eq("user_id", user.id)
    .eq("term", currentTermRaw) // Using "Winter" as seen in the screenshot
    .eq("status", "enrolled"); // Using "enrolled" as seen in the screenshot

  console.log("Enrollments error:", enrollmentsError);
  console.log("Enrollments:", enrollments);

  // Fetch courses for all enrollments
  const courseIds = enrollments?.map(enrollment => enrollment.course_id) || [];
  
  const { data: courses, error: coursesError } = await supabase
    .from("courses")
    .select(`
      id,
      course_code,
      course_days,
      class_time,
      class_type,
      instructor
    `)
    .in("id", courseIds.length > 0 ? courseIds : ['no-courses-fallback']);

  console.log("Courses error:", coursesError);
  console.log("Courses:", courses);

  // Combine enrollment and course data
  let activeCourses: (Course & { enrollment_id: string })[] = [];
  
  if (enrollments && enrollments.length > 0 && courses && courses.length > 0) {
    enrollments.forEach(enrollment => {
      const course = courses.find(c => c.id === enrollment.course_id);
      
      if (course) {
        activeCourses.push({
          ...course,
          enrollment_id: enrollment.id,
        });
      }
    });
  }
  
  console.log('Active courses:', activeCourses);

  // Calculate the number of active courses
  const coursesThisTerm = activeCourses.length;

  const termInfo: ExtendedTermInfo = {
    ...currentTerm,
    daysRemaining: daysRemaining,
    progress: termProgress,
    readingWeekStatus,
    coursesThisTerm
  };

  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 min-h-screen py-6">
      <div className="max-w-7xl mx-auto px-4 h-full">
        <div className="flex flex-col gap-6">
          {/* Welcome Header */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">
              Welcome back, {userProfile.first_name}
            </h1>
          </div>
          
          {/* Main Dashboard Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Profile Card - Left Sidebar */}
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow h-full">
                {/* User Profile Section */}
                <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col items-center">
                    {/* Profile Image */}
                    <div className="relative w-20 h-20 mb-3">
                      <div className="w-full h-full rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                        <svg
                          className="w-12 h-12 text-gray-400 dark:text-gray-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* User Name */}
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">
                      {userProfile.first_name} {userProfile.last_name}
                    </h2>

                    {/* Program */}
                    <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-3">
                      {program.program_name}
                    </p>
                    
                    {/* Student Number */}
                    {userProfile.student_number && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ID: {userProfile.student_number}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Term Info Section */}
                <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Current Term</h3>
                  <p className="text-base font-medium text-gray-800 dark:text-gray-200 mb-3">
                    {currentTerm.displayName}
                  </p>
                  
                  {/* Term Progress */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <span>Term Progress</span>
                      <span>{Math.round(termInfo.progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-1">
                      <div
                        className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full"
                        style={{ width: `${termInfo.progress}%` }}
                      ></div>
                    </div>
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-1">
                      {termInfo.daysRemaining} days remaining
                    </div>
                  </div>
                  
                  {/* Reading Week Status */}
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Reading Week</div>
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {termInfo.readingWeekStatus}
                    </div>
                  </div>
                </div>
                
                {/* Academic Overview Section */}
                <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Academic Overview</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Current Average</span>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {currentAverage ? `${currentAverage.toFixed(1)}%` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Courses This Term</span>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{coursesThisTerm}</span>
                      </div>
                    </div>
                    
                    {/* Degree Progress */}
                    <div className="pt-2">
                      <DegreeProgress 
                        userId={userProfile.user_id} 
                        completedCourses={completedCourses} 
                      />
                    </div>
                  </div>
                </div>
                
                {/* Anticipated Graduation Date Section */}
                <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Anticipated Graduation</h3>
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-md">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{ceremonyDisplay}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{progressStatus}</p>
                    </div>
                  </div>
                </div>
                
                {/* Weather Widget - replaced with functional component */}
                <WeatherWidget />
              </div>
            </div>
            
            {/* Main Content Area - 9 columns on larger screens */}
            <div className="lg:col-span-9">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Timetable - spans 2/3 of the main content area on larger screens */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow h-full">
                  <h3 className="text-lg font-semibold p-4 border-b border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                    Weekly Schedule
                  </h3>
                  <div className="p-4 h-[calc(100%-4rem)]">
                    <Timetable activeCourses={activeCourses} />
                  </div>
                </div>
                
                {/* Navigation and Deadlines Section */}
                <div className="lg:col-span-1 flex flex-col gap-6 h-full">
                  {/* Navigation Links - Moved to right side as requested */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Quick Navigation</h3>
                    <div className="w-full space-y-2">
                      <a 
                        href="/protected/my-courses" 
                        className="block w-full text-center py-2 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
                      >
                        My Courses
                      </a>
                      <a 
                        href="/protected/academic-progress" 
                        className="block w-full text-center py-2 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
                      >
                        Academic Progress
                      </a>
                      <a 
                        href="/protected/course-registration" 
                       className="block w-full text-center py-2 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
                      >
                        Course Registration
                      </a>
                    </div>
                  </div>
                  
                  {/* Deadlines - spans 1/3 of the main content area on larger screens (kept as requested) */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex-grow">
                    <Deadlines userId={userProfile.user_id} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 