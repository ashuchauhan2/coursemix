import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import GradesList from "@/components/academic-progress/GradesList";
import CourseList from "@/components/academic-progress/CourseList";
import { decryptGrade } from "@/utils/grade-utils";
import Link from "next/link";
import { Toaster } from "sonner";
import { getCurrentDateET, formatDate } from "@/utils/date-utils";

export default async function GradesPage() {
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
  
  // Fetch the user's grades
  const { data: grades, error } = await supabase
    .from("student_grades")
    .select("*")
    .eq("user_id", user.id)
    .order("year", { ascending: false })
    .order("term", { ascending: true });
  
  if (error) {
    // console.error("Error fetching grades:", error);
  }
  
  // Decrypt grades for display
  const decryptedGrades: { [id: string]: string } = {};
  
  if (grades) {
    // Keep track of any grades that need to be updated
    const gradesToUpdate: string[] = [];
    
    for (const grade of grades) {
      try {
        // Only attempt to decrypt if the grade field exists and appears to be encrypted
        if (grade.grade && typeof grade.grade === 'string') {
          if (grade.grade.includes(':')) {
            try {
              // Properly handle and log any potential decryption errors
              const decrypted = decryptGrade(grade.grade, user.id);
              decryptedGrades[grade.id] = decrypted;
              // console.log(`Successfully decrypted grade for ${grade.course_code}: ${decrypted}`);
              
              // If the grade has a value but is still marked as "in-progress", mark for status update
              if (grade.status === "in-progress" && decrypted && decrypted.trim() !== '') {
                // console.log(`Marking ${grade.course_code} for status update: in-progress -> completed`);
                gradesToUpdate.push(grade.id);
              }
            } catch (decryptError) {
              // console.error(`Decryption error for ${grade.course_code}:`, decryptError);
              // Store a placeholder value to indicate error
              decryptedGrades[grade.id] = 'Decryption Error';
            }
          } else {
            // For any unencrypted grades
            decryptedGrades[grade.id] = grade.grade;
            // console.log(`Using unencrypted grade for ${grade.course_code}: ${grade.grade}`);
            
            // If the grade has a value but is still marked as "in-progress", mark for status update
            if (grade.status === "in-progress" && grade.grade && grade.grade.trim() !== '') {
              // console.log(`Marking ${grade.course_code} for status update: in-progress -> completed`);
              gradesToUpdate.push(grade.id);
            }
          }
        } else {
          // If grade is missing or null
          decryptedGrades[grade.id] = 'N/A';
          // console.log(`No grade data for ${grade.course_code}`);
        }
      } catch (e) {
        // console.error(`General error processing grade ${grade.id} for ${grade.course_code}:`, e);
        decryptedGrades[grade.id] = 'Error';
      }
    }
    
    // Update any grades that need to be changed from "in-progress" to "completed"
    if (gradesToUpdate.length > 0) {
      // console.log(`Updating ${gradesToUpdate.length} grades from "in-progress" to "completed"`);
      
      // Update grades in bulk
      const { error: updateError } = await supabase
        .from("student_grades")
        .update({ status: "completed" })
        .in("id", gradesToUpdate);
      
      if (updateError) {
        // console.error("Error updating grade statuses:", updateError);
      } else {
        // console.log(`Successfully updated ${gradesToUpdate.length} grades to "completed" status`);
        
        // Update the local grades array to reflect the changes
        grades.forEach(grade => {
          if (gradesToUpdate.includes(grade.id)) {
            grade.status = "completed";
          }
        });
      }
    }
  }
  
  // Debug output all grades and their decrypted values
  // console.log('All grades with decrypted values:');
  // grades?.forEach(grade => {
  //   console.log(`${grade.course_code}: DB value = ${grade.grade}, Decrypted = ${decryptedGrades[grade.id]}, Status = ${grade.status}`);
  // });
  
  // Get user's program
  const { data: programData } = await supabase
    .from("user_profiles")
    .select("program_id")
    .eq("user_id", user.id)
    .single();

  const hasProgram = programData && programData.program_id;
  let programCourses = [];
  let isCoopProgram = false;
  let programInfo = null;

  // Get program information and requirements
  if (hasProgram) {
    // Get program information
    const { data: program, error: programError } = await supabase
      .from("programs")
      .select("*")
      .eq("id", programData.program_id)
      .single();
    
    if (programError) {
      console.error("Error fetching program info:", programError);
    } else {
      programInfo = program;
      // Check if this is a co-op program
      isCoopProgram = program?.coop_program || false;
    }

    // Get program requirements
    const { data: courses, error: coursesError } = await supabase
      .from("program_requirements")
      .select("*")
      .eq("program_id", programData.program_id);
    
    if (coursesError) {
      console.error("Error fetching program courses:", coursesError);
    } else {
      programCourses = courses || [];
    }
  }

  // Fetch work terms if this is a co-op program
  let workTerms = [];
  if (isCoopProgram) {
    const { data: workTermsData, error: workTermsError } = await supabase
      .from("work_terms")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    
    if (workTermsError) {
      console.error("Error fetching work terms:", workTermsError);
    } else {
      workTerms = workTermsData || [];
    }
  }

  // Calculate graduation date projection
  let completedCourses = 0;
  let inProgressCourses = 0;
  
  // Get the highest year from program courses to determine program length
  const maxProgramYear = programCourses.length > 0 
    ? Math.max(...programCourses.map((course: any) => course.year || 0))
    : 4; // Default to 4 years if no program data
  
  // Filter out failed courses and courses below minimum grade
  if (grades) {
    grades.forEach(grade => {
      // Get the requirement for this course, if it exists
      const requirement = programCourses.find((req: any) => req.course_code === grade.course_code);
      const minGradeRequired = requirement?.min_grade || 50; // Default to 50 if not specified
      
      // Get the numeric value of the grade
      const gradeValue = decryptedGrades[grade.id];
      let numericGrade = 0;
      
      if (gradeValue && gradeValue !== 'N/A' && gradeValue !== 'Error' && gradeValue !== 'Decryption Error') {
        if (!isNaN(Number(gradeValue))) {
          numericGrade = Number(gradeValue);
        } else {
          // Convert letter grades to numeric
          switch(gradeValue) {
            case 'A+': numericGrade = 90; break;
            case 'A': numericGrade = 85; break;
            case 'A-': numericGrade = 80; break;
            case 'B+': numericGrade = 77; break;
            case 'B': numericGrade = 75; break;
            case 'B-': numericGrade = 70; break;
            case 'C+': numericGrade = 67; break;
            case 'C': numericGrade = 65; break;
            case 'C-': numericGrade = 60; break;
            case 'D+': numericGrade = 57; break;
            case 'D': numericGrade = 55; break;
            case 'D-': numericGrade = 50; break;
            case 'F': numericGrade = 45; break;
            default: numericGrade = 0;
          }
        }
      }
      
      // Count completed courses that meet minimum grade requirements
      if (grade.status === 'completed' && numericGrade >= minGradeRequired) {
        completedCourses++;
      } else if (grade.status === 'in-progress') {
        // Count in-progress courses toward graduation progress
        inProgressCourses++;
      }
    });
  }
  
  // Calculate graduation projection
  const now = getCurrentDateET();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  // Calculate total courses required (default to 40 if not specified)
  const totalRequiredCourses = programInfo?.total_credits || 40;
  
  // Calculate remaining courses, accounting for in-progress courses
  const effectiveCompletedCourses = completedCourses + inProgressCourses;
  const remainingCourses = Math.max(0, totalRequiredCourses - effectiveCompletedCourses);
  
  // Standard course load
  const coursesPerTerm = 5;
  
  // Special case: if 5 or fewer courses remaining, graduate next term
  let graduationTerm: string;
  let graduationYear = currentYear;
  let graduationMonth = currentMonth;
  
  // Determine current term
  const isFallTerm = currentMonth >= 8 && currentMonth <= 11; // Sept-Dec
  const isWinterTerm = currentMonth >= 0 && currentMonth <= 3; // Jan-Apr
  const isSpringTerm = currentMonth >= 4 && currentMonth <= 7; // May-Aug
  
  if (remainingCourses <= coursesPerTerm) {
    // Student will graduate next term
    if (isFallTerm) {
      // If currently in Fall, graduate in Winter
      graduationTerm = "Winter";
      graduationMonth = 0; // January
      graduationYear = currentYear + 1;
    } else if (isWinterTerm) {
      // If currently in Winter, graduate in Spring
      graduationTerm = "Spring";
      graduationMonth = 4; // May
    } else {
      // If currently in Spring, graduate in Fall
      graduationTerm = "Fall";
      graduationMonth = 8; // September
    }
  } else {
    // Calculate terms needed to complete remaining courses
    // Each term can handle 5 courses, but only count Fall and Winter terms
    const termsNeeded = Math.ceil(remainingCourses / coursesPerTerm);
    
    // We need to advance by the required number of terms, but only counting Fall and Winter
    let termCount = 0;
    let monthCount = 0;
    let yearCount = 0;
    
    // Initial month and year
    let month = currentMonth;
    let year = currentYear;
    
    // If we're in Spring term, move to Fall since we don't count Spring courses
    if (isSpringTerm) {
      month = 8; // September (start of Fall)
    }
    
    while (termCount < termsNeeded) {
      // Move to next month
      month++;
      monthCount++;
      
      // Handle year rollover
      if (month > 11) {
        month = 0;
        year++;
        yearCount++;
      }
      
      // Only count Fall and Winter terms
      if ((month == 8) || (month == 0)) { // September or January
        termCount++;
      }
    }
    
    // Determine final graduation term
    if (month >= 0 && month <= 3) {
      graduationTerm = "Winter";
      graduationMonth = 0; // January
    } else if (month >= 4 && month <= 7) {
      graduationTerm = "Spring";
      graduationMonth = 4; // May
    } else {
      graduationTerm = "Fall";
      graduationMonth = 8; // September
    }
    
    graduationYear = year;
  }
  
  // Determine convocation ceremony (Spring or Fall) based on course completion term
  let ceremonyTerm = "";
  let ceremonyYear = graduationYear;
  
  // Map academic term to convocation ceremony
  if (graduationTerm === "Winter" || graduationTerm === "Spring") {
    // Winter term (Jan-Apr) and Spring term (May-Aug) completions attend Spring convocation
    ceremonyTerm = "Spring";
    // Ceremony is in the same year courses are completed
  } else {
    // Fall term (Sept-Dec) completions attend Fall convocation
    ceremonyTerm = "Fall";
    // Ceremony is in the same year courses are completed
  }
  
  // Only use ceremony term and year for display
  const ceremonyDisplay = `${ceremonyTerm} ${ceremonyYear}`;
  
  // Prepare graduation projection data to pass to GradesList
  const graduationProjection = {
    projectedDate: "", // Empty string to satisfy TypeScript
    termDisplay: ceremonyDisplay,
    coursesPerTerm,
    remainingCourses,
    totalRequiredCourses,
    isCeremony: true // Flag to indicate this is a ceremony projection
  };

  return (
    <main className="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 min-h-screen py-6">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Academic Progress</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            View your degree progression and manage your course grades.
          </p>
        </div>

        {/* Grades Overview Section */}
        <div className="mb-8">
          <GradesList 
            grades={grades || []} 
            decryptedGrades={decryptedGrades}
            graduationProjection={graduationProjection}
          />
        </div>

        {/* Program Course Display Section */}
        {hasProgram ? (
          programCourses.length > 0 ? (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Program Requirements</h2>
              
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4 flex items-center text-sm">
                <div className="text-blue-500 dark:text-blue-400 mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                  </svg>
                </div>
                <div className="text-blue-700 dark:text-blue-300">
                  <span className="font-medium">Pro Tip:</span> Click the <span className="inline-flex items-center justify-center bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-full h-4 w-4 text-xs mx-0.5">+</span> icon on any course to mark it as "in progress". This helps you track courses you're currently taking before entering final grades.
                </div>
              </div>
              
              <CourseList 
                courses={programCourses}
                grades={grades || []}
                decryptedGrades={decryptedGrades}
                userId={user.id}
                isCoopProgram={isCoopProgram}
                workTerms={workTerms}
              />
            </div>
          ) : (
            <div className="my-5 bg-blue-100 dark:bg-blue-900/20 rounded-lg shadow-md p-6 border border-blue-200 dark:border-blue-800 text-center">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Program Selected</h2>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Your program has been selected, but no course requirements were found. 
                Please contact support if you believe this is an error.
              </p>
            </div>
          )
        ) : (
          <div className="my-5 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg shadow-md p-6 border border-yellow-200 dark:border-yellow-800 text-center">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">No Program Selected</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Please <Link href="/protected/profile/edit" className="text-blue-600 dark:text-blue-400 hover:underline">select a program</Link> to view your degree requirements.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
