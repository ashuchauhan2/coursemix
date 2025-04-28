'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { CoursePrerequisite } from '@/types';

interface CourseRequirement {
  id: string;
  program_id: number;
  year: number;
  course_code: string;
  credit_weight: number;
  requirement_type: string;
  min_grade?: number;
  created_at: string;
  updated_at: string;
}

interface StudentGrade {
  id: string;
  user_id: string;
  course_code: string;
  requirement_id?: string;
  grade: string;
  term: string;
  year: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface SuggestedCourse {
  id: string;
  course_code: string;
  year: number;
  requirement_type: string;
  display_code?: string; // Added for elective display
}

interface ElectiveSuggestion {
  id: string;
  course_code: string;
  created_at: string;
}

interface CourseSuggestionsProps {
  userId: string;
}

export default function CourseSuggestions({ userId }: CourseSuggestionsProps) {
  const [loading, setLoading] = useState(true);
  const [suggestedCourses, setSuggestedCourses] = useState<SuggestedCourse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [electiveSuggestionsAvailable, setElectiveSuggestionsAvailable] = useState(false);
  const [electiveSuggestions, setElectiveSuggestions] = useState<ElectiveSuggestion[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function fetchSuggestions() {
      try {
        setLoading(true);
        
        // Step 1: Get the user's program ID
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('program_id')
          .eq('user_id', userId)
          .single();
          
        if (profileError || !userProfile?.program_id) {
          setError('Could not determine user program');
          setLoading(false);
          return;
        }
        
        // Step 2: Fetch program requirements
        const { data: programRequirements, error: requirementsError } = await supabase
          .from('program_requirements')
          .select('*')
          .eq('program_id', userProfile.program_id);
          
        if (requirementsError || !programRequirements) {
          setError('Could not fetch program requirements');
          setLoading(false);
          return;
        }
        
        // Step 3: Fetch student's completed or in-progress courses
        const { data: studentGrades, error: gradesError } = await supabase
          .from('student_grades')
          .select('*')
          .eq('user_id', userId);
          
        if (gradesError) {
          setError('Could not fetch student grades');
          setLoading(false);
          return;
        }
        
        // Step 3.5: Fetch elective suggestions - with explicit debugging
        console.log('Attempting to fetch from elective_suggestions table...');
        
        // Try with public schema explicitly
        const { data: fetchedElectiveSuggestions, error: electiveError } = await supabase
          .from('elective_suggestions')
          .select('id, course_code, created_at');
          
        // Log detailed information about the query result
        console.log('Elective suggestions query result:', { 
          data: fetchedElectiveSuggestions, 
          error: electiveError,
          errorMessage: electiveError?.message,
          errorDetails: electiveError?.details,
        });
        
        // Hard-code suggestions if table query fails
        let suggestionsToUse: ElectiveSuggestion[] = [];
        
        if (electiveError || !fetchedElectiveSuggestions || fetchedElectiveSuggestions.length === 0) {
          console.warn('Could not fetch from database, using hardcoded elective suggestions');
          // Use hardcoded suggestions as fallback
          suggestionsToUse = [
            { id: '1', course_code: 'MKTG 2P51', created_at: new Date().toISOString() },
            { id: '2', course_code: 'IASC 1P02', created_at: new Date().toISOString() },
            { id: '3', course_code: 'ASTR 1P01', created_at: new Date().toISOString() },
            { id: '4', course_code: 'IASC 2P07', created_at: new Date().toISOString() },
            { id: '5', course_code: 'ECON 1P92', created_at: new Date().toISOString() },
            { id: '6', course_code: 'ITIS 2P51', created_at: new Date().toISOString() },
            { id: '7', course_code: 'ERSC 1P94', created_at: new Date().toISOString() },
            { id: '8', course_code: 'ERSC 1P92', created_at: new Date().toISOString() },
            { id: '9', course_code: 'APCO 1P01', created_at: new Date().toISOString() },
            { id: '10', course_code: 'ECON 1P91', created_at: new Date().toISOString() },
            { id: '11', course_code: 'ASTR 1P02', created_at: new Date().toISOString() },
          ];
        } else {
          suggestionsToUse = fetchedElectiveSuggestions;
        }
          
        const hasElectiveSuggestions = suggestionsToUse.length > 0;
        setElectiveSuggestionsAvailable(hasElectiveSuggestions);
        setElectiveSuggestions(suggestionsToUse);
        
        if (hasElectiveSuggestions) {
          console.log('Elective suggestions available:', suggestionsToUse.length);
          console.log('Sample suggestion:', suggestionsToUse[0]);
        }
        
        // Create sets of completed requirement IDs and course codes for prerequisite checking
        const completedRequirementIds = new Set<string>();
        const completedCourses = new Set<string>();
        const inProgressCourses = new Set<string>();
        
        (studentGrades || []).forEach(grade => {
          if (grade.status === 'completed') {
            // Track both the completed requirement ID and course code
            if (grade.requirement_id) {
              completedRequirementIds.add(grade.requirement_id);
            }
            completedCourses.add(grade.course_code);
          } else if (grade.status === 'in-progress') {
            inProgressCourses.add(grade.course_code);
          }
        });
        
        // Step 4: Find courses that need to be taken (specific requirement not completed and not in progress)
        const requiredCourses = programRequirements.filter(requirement => {
          // For requirements with specific IDs, check if that exact requirement ID has been completed
          return !(
            completedRequirementIds.has(requirement.id) || 
            inProgressCourses.has(requirement.course_code)
          );
        });
        
        // Step 5: Sort by year (ascending) to prioritize earlier year courses
        requiredCourses.sort((a, b) => a.year - b.year);
        
        // Step 6: Prepare to check prerequisites for each potential suggestion
        const { data: allPrerequisites, error: prerequisitesError } = await supabase
          .from('course_prerequisites')
          .select('*');
          
        if (prerequisitesError) {
          setError('Could not fetch course prerequisites');
          setLoading(false);
          return;
        }

        // Create a map for quick prerequisite lookup
        const prerequisiteMap = new Map<string, CoursePrerequisite[]>();
        (allPrerequisites || []).forEach(prereq => {
          if (!prerequisiteMap.has(prereq.course_code)) {
            prerequisiteMap.set(prereq.course_code, []);
          }
          prerequisiteMap.get(prereq.course_code)!.push(prereq);
        });
        
        // Function to check if prerequisites are met for a course
        const arePrerequisitesMet = (courseCode: string): boolean => {
          const prerequisites = prerequisiteMap.get(courseCode);
          
          // If no prerequisites, return true
          if (!prerequisites || prerequisites.length === 0) {
            return true;
          }
          
          // Check if all prerequisites are met
          return prerequisites.every(prereq => {
            // If prerequisite is completed and meets minimum grade requirement
            if (completedCourses.has(prereq.prerequisite_code)) {
              // We don't have access to the actual grade value here
              // In a real implementation, we would check the min_grade requirement
              return true;
            }
            return false;
          });
        };
        
        // Step 7: Filter courses based on prerequisites and limit to 5
        const eligibleCourses = requiredCourses
          .filter(course => arePrerequisitesMet(course.course_code))
          .slice(0, 5)
          .map(course => {
            const result: SuggestedCourse = {
              id: course.id,
              course_code: course.course_code,
              year: course.year,
              requirement_type: course.requirement_type
            };
            
            // Check for elective courses (case insensitive)
            const isElective = course.course_code.toUpperCase() === 'ELECTIVE';
            
            // If this is an ELECTIVE course, assign a random suggestion as display_code
            if (isElective && hasElectiveSuggestions) {
              const randomIndex = Math.floor(Math.random() * suggestionsToUse.length);
              result.display_code = suggestionsToUse[randomIndex].course_code;
              console.log('Replaced ELECTIVE with suggestion:', result.display_code);
            }
            
            return result;
          });
        
        console.log('Suggested courses:', eligibleCourses);
        setSuggestedCourses(eligibleCourses);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching course suggestions:', err);
        setError('An error occurred while fetching course suggestions');
        setLoading(false);
      }
    }
    
    fetchSuggestions();
  }, [userId, supabase]);

  // Function to swap an elective suggestion with a new random one
  const getNewElectiveSuggestion = (courseId: string) => {
    if (electiveSuggestions.length === 0) return;
    
    setSuggestedCourses(currentCourses => {
      return currentCourses.map(course => {
        if (course.id === courseId && course.course_code.toUpperCase() === 'ELECTIVE') {
          const randomIndex = Math.floor(Math.random() * electiveSuggestions.length);
          const newSuggestion = electiveSuggestions[randomIndex].course_code;
          console.log(`Swapped elective suggestion for ${courseId} to ${newSuggestion}`);
          return {
            ...course,
            display_code: newSuggestion
          };
        }
        return course;
      });
    });
  };

  if (loading) {
    return (
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-red-200 dark:border-red-900">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (suggestedCourses.length === 0) {
    return (
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <p className="text-gray-600 dark:text-gray-300">No course suggestions available. You may have completed all required courses, or there might not be suitable courses to suggest at this time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Suggested Courses</h2>
      
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {suggestedCourses.map((course) => (
          <div 
            key={course.id} 
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Year {course.year}</span>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                {course.requirement_type.charAt(0).toUpperCase() + course.requirement_type.slice(1)}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">
              {course.display_code || course.course_code}
              {course.course_code.toUpperCase() === 'ELECTIVE' && course.display_code && (
                <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">(Elective)</span>
              )}
            </h3>
            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 space-y-2">
              {course.course_code.toUpperCase() === 'ELECTIVE' && (
                <button
                  className="w-full py-1.5 px-3 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1 dark:focus:ring-offset-gray-800 flex items-center justify-center"
                  onClick={() => getNewElectiveSuggestion(course.id)}
                >
                  <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                  Try Another Elective
                </button>
              )}
              <button
                className="w-full py-1.5 px-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800"
                onClick={() => {
                  // Create and dispatch a custom event that the CourseSearch component can listen for
                  const event = new CustomEvent('suggestionSelected', {
                    bubbles: true,
                    detail: { courseCode: course.display_code || course.course_code }
                  });
                  
                  // Dispatch the event at the document level so it can be caught anywhere
                  document.dispatchEvent(event);
                  
                  // Find the search section and scroll to it
                  const searchSection = document.querySelector('.bg-white.dark\\:bg-gray-800.rounded-lg.shadow-md.p-6:not(:first-child)');
                  if (searchSection) {
                    searchSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
              >
                Search for Course
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {!electiveSuggestionsAvailable && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-md">
          <p className="text-yellow-700 dark:text-yellow-400 text-sm">
            Note: Elective suggestions could not be loaded. Please contact an administrator.
          </p>
        </div>
      )}
    </div>
  );
} 