"use client";

import { createClient } from "@/utils/supabase/client";
import { redirect } from "next/navigation";
import { useState, useEffect } from "react";
import { Course } from "@/types";
import ReviewForm from "@/components/course-reviews/ReviewForm";

export default function Review_Page() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourses() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return redirect("/sign-in");

      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("course_id")
        .eq("user_id", user.id)
        .eq("status", "enrolled");

      if (enrollments) {
        const courseIds = enrollments.map((enrollment: { course_id: string }) => enrollment.course_id);
        const { data: courses } = await supabase
          .from("courses")
          .select("*")
          .in("id", courseIds);

        if (courses) setCourses(courses);
      }
      setLoading(false);
    }
    fetchCourses();
  }, []);

  if (loading) return <p className="text-center text-gray-600 dark:text-gray-300">Loading...</p>;

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Course Reviews</h1>
      {courses.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-300">No courses available for review.</p>
      ) : (
        <>
          <label htmlFor="course-select" className="sr-only">Select a course</label>
          <select 
            id="course-select"
            onChange={(e) => {
              const course = courses.find(c => c.id === e.target.value);
              setSelectedCourse(course || null);
            }}
            className="mb-4 p-2 border border-gray-300 dark:border-gray-600 rounded-lg w-full max-w-md dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select a course</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.course_code}</option>
            ))}
          </select>
          
          {selectedCourse && (
            <>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">{selectedCourse.course_code}</h2>
                <ReviewForm courseId={selectedCourse.id} courseName={selectedCourse.course_code} />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}