'use client';

import { useState, useEffect } from "react";
import { Course } from "@/types";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

interface CourseCardProps {
  course: Course;
  userId: string;
}

export default function CourseCard({ course, userId }: CourseCardProps) {
  const [isDropping, setIsDropping] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Debug info for enrollment ID
  useEffect(() => {
    console.log(`CourseCard for ${course.course_code}: enrollment_id = ${course.enrollment_id}`);
    console.log("Course data:", JSON.stringify(course));
  }, [course]);
  
  // Format class time for display
  const formatClassTime = (time?: string) => {
    if (!time) return "N/A";
    
    // Parse time from format like "900-1200" or "1300-1450"
    const cleanTime = time.replace(/\s+/g, '');
    const [start, end] = cleanTime.split('-');
    
    // Format as "9:00 AM - 12:00 PM"
    const formatTimeString = (timeStr: string) => {
      let hours = parseInt(timeStr.substring(0, timeStr.length - 2));
      const minutes = timeStr.length >= 2 ? timeStr.substring(timeStr.length - 2) : '00';
      const period = hours >= 12 ? 'PM' : 'AM';
      
      if (hours > 12) hours -= 12;
      if (hours === 0) hours = 12;
      
      return `${hours}:${minutes} ${period}`;
    };
    
    return `${formatTimeString(start)} - ${formatTimeString(end)}`;
  };
  
  // Format course days for display
  const formatCourseDays = (days?: string) => {
    if (!days) return "N/A";
    
    const dayMapping: Record<string, string> = {
      'M': 'Monday',
      'T': 'Tuesday',
      'W': 'Wednesday',
      'R': 'Thursday',
      'F': 'Friday'
    };
    
    // Clean up any spaces in the days string
    const cleanDays = days.replace(/\s+/g, '');
    
    // Map each character to its full day name
    return Array.from(cleanDays).map(day => dayMapping[day] || day).join(', ');
  };
  
  // Function to drop the course
  const dropCourse = async () => {
    setIsDropping(true);
    setError(null);
    
    // Verify we have an enrollment ID
    if (!course.enrollment_id) {
      setError("Cannot drop course: missing enrollment ID");
      setIsDropping(false);
      return;
    }
    
    try {
      console.log(`Attempting to drop course: ${course.course_code} (enrollment ID: ${course.enrollment_id})`);
      
      const supabase = createClient();
      
      // Delete the enrollment record completely
      const { error } = await supabase
        .from("enrollments")
        .delete()
        .eq("id", course.enrollment_id)
        .eq("user_id", userId);
      
      if (error) {
        console.error("Error response from Supabase:", error);
        throw error;
      }
      
      console.log(`Successfully dropped course: ${course.course_code}`);
      
      // Refresh the page to reflect changes
      router.refresh();
      setShowConfirmation(false);
    } catch (err) {
      console.error("Error dropping course:", err);
      setError("There was an error dropping the course. Please try again.");
    } finally {
      setIsDropping(false);
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 relative">
      {showConfirmation && (
        <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-95 dark:bg-opacity-95 rounded-lg flex flex-col items-center justify-center p-6 z-10">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Confirm Drop Course</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
            Are you sure you want to drop <span className="font-semibold">{course.course_code}</span>? 
            This will completely remove the course from your enrollments.
          </p>
          <div className="flex space-x-4">
            <button
              onClick={() => setShowConfirmation(false)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              disabled={isDropping}
            >
              Cancel
            </button>
            <button
              onClick={dropCourse}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 transition-colors"
              disabled={isDropping}
            >
              {isDropping ? "Dropping..." : "Drop Course"}
            </button>
          </div>
          {error && <p className="text-red-600 dark:text-red-400 mt-4">{error}</p>}
        </div>
      )}
      
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{course.course_code}</h2>
        </div>
        <button
          onClick={() => setShowConfirmation(true)}
          className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors"
        >
          Drop Course
        </button>
      </div>
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Course Details</h3>
          <div className="space-y-2">
            <div className="flex">
              <span className="text-gray-600 dark:text-gray-400 w-24">Type:</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">{course.class_type || "N/A"}</span>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Schedule</h3>
          <div className="space-y-2">
            <div className="flex">
              <span className="text-gray-600 dark:text-gray-400 w-24">Days:</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">{formatCourseDays(course.course_days)}</span>
            </div>
            <div className="flex">
              <span className="text-gray-600 dark:text-gray-400 w-24">Time:</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">{formatClassTime(course.class_time)}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Instructor</h3>
        <p className="font-medium text-gray-800 dark:text-gray-200">{course.instructor || "TBA"}</p>
      </div>
    </div>
  );
} 