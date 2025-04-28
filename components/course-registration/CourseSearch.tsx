'use client';

import React, { useState, useCallback, useEffect, ReactNode } from 'react';
import { createClient } from '@/utils/supabase/client';
import debounce from 'lodash.debounce';
import { Course } from '@/types';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/utils/date-utils';

interface CourseSearchProps {
  userId: string;
  term: string;
  year: number;
}

// Function to map course duration code to descriptive term text
const getDurationInfo = (durationCode?: string | number) => {
  if (!durationCode) return null;
  
  // Convert to string in case it's a number
  const code = String(durationCode);
  
  switch(code.toUpperCase()) {
    case 'D1':
      return {
        description: 'Full Year Course',
        period: 'September to April',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )
      };
    case 'D2':
      return {
        description: 'Fall Term Course',
        period: 'September to December',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
          </svg>
        )
      };
    case 'D3':
      return {
        description: 'Winter Term Course',
        period: 'January to April',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
        )
      };
    default:
      return {
        description: `Duration: ${code}`,
        period: '',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      };
  }
};

// Function to get course type information
const getCourseTypeInfo = (type?: string) => {
  if (!type) return null;
  
  const typeUpper = type.toUpperCase();
  
  // Define the course types and their descriptions
  const typeMap: Record<string, { description: string; icon: ReactNode; isOnline: boolean }> = {
    'LEC': {
      description: 'Lecture',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1M19 8l-7 5-7-5" />
        </svg>
      ),
      isOnline: false
    },
    'SEM': {
      description: 'Seminar',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      isOnline: false
    },
    'LAB': {
      description: 'Laboratory',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      isOnline: false
    },
    'LL': {
      description: 'Lecture/Lab',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      isOnline: false
    },
    'TUT': {
      description: 'Tutorial',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      isOnline: false
    },
    'FLD': {
      description: 'Field Course',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 9c0 .552.448 1 1 1h12c.552 0 1-.448 1-1s-.448-1-1-1H6c-.552 0-1 .448-1 1zm0 4c0 .552.448 1 1 1h12c.552 0 1-.448 1-1s-.448-1-1-1H6c-.552 0-1 .448-1 1zm0 4c0 .552.448 1 1 1h12c.552 0 1-.448 1-1s-.448-1-1-1H6c-.552 0-1 .448-1 1z" />
        </svg>
      ),
      isOnline: false
    },
    'IFT': {
      description: 'International Field Experience',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      isOnline: false
    },
    'INT': {
      description: 'Internship',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      isOnline: false
    },
    'CLI': {
      description: 'Practicum (Clinic)',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      isOnline: false
    },
    'PRO': {
      description: 'Project',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      isOnline: false
    },
    // Online course types
    'ASY': {
      description: 'Asynchronous Online',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      ),
      isOnline: true
    },
    'ASO': {
      description: 'Asynchronous Online with On-Campus Exams',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      isOnline: true
    },
    'SYN': {
      description: 'Synchronous Online',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      isOnline: true
    },
    'SYO': {
      description: 'Synchronous Online with On-Campus Exams',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      isOnline: true
    },
    'BLD': {
      description: 'Blended – Mixed Location',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
        </svg>
      ),
      isOnline: false
    },
    'ONM': {
      description: 'Blended – Online Mixed',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      isOnline: true
    },
    'HYF': {
      description: 'Hyflex',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      isOnline: false
    }
  };

  // Return the course type info if it exists in our map, otherwise return a generic entry
  return typeMap[typeUpper] || {
    description: type,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    isOnline: false
  };
};

// Function to check if course duration is valid for current date
const isCourseDurationValid = (courseDuration?: string | number): boolean => {
  if (!courseDuration) return false;
  
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11
  
  // Convert duration to string in case it's a number
  const duration = String(courseDuration);
  
  // September (9) to December (12): Allow Duration 1 (full year) and Duration 2 (fall term)
  if (currentMonth >= 9 && currentMonth <= 12) {
    return ['1', 'D1', '2', 'D2'].includes(duration);
  }
  
  // January (1) to April (4): Allow only Duration 3 (winter term)
  if (currentMonth >= 1 && currentMonth <= 4) {
    return ['3', 'D3'].includes(duration);
  }
  
  // For all other months (May-August), allow any duration
  return true;
};

export default function CourseSearch({ userId, term, year }: CourseSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [enrollingCourse, setEnrollingCourse] = useState<string | null>(null);
  const [droppingCourse, setDroppingCourse] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
  const [selectedDuration, setSelectedDuration] = useState<number>(0);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [courseConflicts, setCourseConflicts] = useState<Course[]>([]);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [pendingCourseId, setPendingCourseId] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  // Popular subjects for quick filtering
  const popularSubjects = [
    { code: 'COSC', label: 'Computer Science' },
    { code: 'MATH', label: 'Mathematics' },
    { code: 'CHEM', label: 'Chemistry' },
    { code: 'ECON', label: 'Economics' },
    { code: 'ERSC', label: 'Earth Sciences' },
  ];

  // Duration options for the filter
  const durationOptions = [
    { value: 0, label: 'All Durations' },
    { value: 1, label: 'Duration 1' },
    { value: 2, label: 'Duration 2' },
    { value: 3, label: 'Duration 3' },
  ];

  // For debugging
  useEffect(() => {
    console.log(`CourseSearch initialized with: userId=${userId}, term=${term}, year=${year}`);
  }, [userId, term, year]);

  // Fetch user's enrolled courses on component mount
  useEffect(() => {
    async function fetchEnrolledCourses() {
      try {
        // First get the enrollment records
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('enrollments')
          .select('course_id')
          .eq('user_id', userId)
          .eq('term', term)
          .eq('status', 'enrolled');

        if (enrollmentsError) {
          console.error('Error fetching enrolled courses:', enrollmentsError);
          return;
        }
        
        if (!enrollments || enrollments.length === 0) {
          setEnrolledCourseIds(new Set());
          setEnrolledCourses([]);
          return;
        }
        
        // Get the IDs of enrolled courses
        const courseIds = enrollments.map(enrollment => enrollment.course_id);
        setEnrolledCourseIds(new Set(courseIds));
        
        // Then fetch the complete course details
        const { data: courseDetails, error: coursesError } = await supabase
          .from('courses')
          .select('*')
          .in('id', courseIds);
          
        if (coursesError) {
          console.error('Error fetching enrolled course details:', coursesError);
          return;
        }
        
        if (courseDetails) {
          setEnrolledCourses(courseDetails);
        }
      } catch (error) {
        console.error('Error fetching enrolled courses:', error);
      }
    }

    fetchEnrolledCourses();
  }, [userId, term, supabase]);

  // Helper function to normalize course code for search
  const normalizeCourseCode = (code: string): string => {
    return code.replace(/\s+/g, '').toUpperCase();
  };

  // Parse course days string into an array of days
  const parseDays = (daysStr?: string): string[] => {
    if (!daysStr) return [];
    
    // Common formats: "MWF", "TR", "M/W/F", "T/R", etc.
    const normalizedDays = daysStr.toUpperCase()
      .replace(/[^MTWRFSU]/g, '') // Keep only M, T, W, R, F, S, U
      .split('');
    
    // Convert R to Th for Thursday
    return normalizedDays.map(day => day === 'R' ? 'Th' : day);
  };

  // Parse time string into start and end times in minutes
  const parseTime = (timeStr?: string): { start: number; end: number } | null => {
    if (!timeStr) return null;
    
    // Pattern for time strings like "9:00-10:00", "9:00 AM - 10:30 AM", "14:00-15:30"
    const timePattern = /(\d{1,2}):?(\d{2})?\s*(AM|PM)?\s*[-–—]\s*(\d{1,2}):?(\d{2})?\s*(AM|PM)?/i;
    const match = timeStr.match(timePattern);
    
    if (!match) return null;
    
    let [_, startHour, startMin = '00', startAmPm, endHour, endMin = '00', endAmPm] = match;
    
    // Convert hours to 24-hour format
    let startHour24 = parseInt(startHour);
    let endHour24 = parseInt(endHour);
    
    // Handle AM/PM
    if (startAmPm && startAmPm.toUpperCase() === 'PM' && startHour24 < 12) startHour24 += 12;
    if (startAmPm && startAmPm.toUpperCase() === 'AM' && startHour24 === 12) startHour24 = 0;
    if (endAmPm && endAmPm.toUpperCase() === 'PM' && endHour24 < 12) endHour24 += 12;
    if (endAmPm && endAmPm.toUpperCase() === 'AM' && endHour24 === 12) endHour24 = 0;
    
    // Convert to minutes for easier comparison
    const startMinutes = startHour24 * 60 + parseInt(startMin);
    const endMinutes = endHour24 * 60 + parseInt(endMin);
    
    return { start: startMinutes, end: endMinutes };
  };

  // Check if two courses have overlapping schedules
  const hasScheduleConflict = (course1: Course, course2: Course): boolean => {
    // If either course is missing schedule information, assume no conflict
    if (!course1.course_days || !course1.class_time || !course2.course_days || !course2.class_time) {
      return false;
    }
    
    const days1 = parseDays(course1.course_days);
    const days2 = parseDays(course2.course_days);
    
    // Check for overlapping days
    const sharedDays = days1.filter(day => days2.includes(day));
    if (sharedDays.length === 0) return false;
    
    // Parse time ranges
    const time1 = parseTime(course1.class_time);
    const time2 = parseTime(course2.class_time);
    
    if (!time1 || !time2) return false;
    
    // Check for time overlap on shared days
    return (
      (time1.start <= time2.end && time1.end >= time2.start)
    );
  };

  // Find conflicts between a new course and existing enrolled courses
  const findScheduleConflicts = (newCourse: Course, enrolledCourses: Course[]): Course[] => {
    return enrolledCourses.filter(enrolledCourse => 
      hasScheduleConflict(newCourse, enrolledCourse)
    );
  };

  // Debounced search function
  const searchCourses = async (query: string, subject: string | null, duration: number) => {
    if (!query && duration === 0 && !subject) {
      setCourses([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Build the base query
      let supabaseQuery = supabase
        .from('courses')
        .select(`
          id,
          course_code,
          course_days,
          class_time,
          class_type,
          instructor,
          start_date,
          end_date,
          course_duration
        `);

      // Add search query if it exists
      if (query.length >= 2) {
        const noSpacesQuery = query.replace(/\s+/g, '').toUpperCase();
        const withSpacesQuery = query.toUpperCase();

        // Split the query into subject and number parts if possible
        const matches = noSpacesQuery.match(/^([A-Z]+)(\d.*)?$/);
        const subjectPart = matches?.[1] || '';
        const numberPart = matches?.[2] || '';

        // Create different variations of the search pattern
        const searchPatterns = [
          noSpacesQuery,                              // e.g., "COSC1P50"
          withSpacesQuery,                            // e.g., "COSC 1P50"
          subjectPart + ' ' + numberPart,            // e.g., "COSC 1P50"
          subjectPart + numberPart                   // e.g., "COSC1P50"
        ].filter(Boolean); // Remove empty patterns

        // Build the search condition
        const searchConditions = searchPatterns.map(pattern => 
          `course_code.ilike.%${pattern}%`
        ).join(',');

        supabaseQuery = supabaseQuery.or(searchConditions);
      }

      // Add subject filter if selected
      if (subject) {
        supabaseQuery = supabaseQuery.ilike('course_code', `${subject}%`);
      }

      // Add duration filter if not "All Durations"
      if (duration > 0) {
        supabaseQuery = supabaseQuery.eq('course_duration', duration);
      }

      // Determine limit based on search query specificity
      // More specific searches get a higher limit to ensure we find matching courses
      let resultLimit = 20;
      
      // If we have a more specific query (likely contains course number), increase the limit
      if (query.length > 5 || (query.match(/\d/) && query.length > 3)) {
        resultLimit = 100; // Increased limit for specific searches
      }

      // Execute the query with dynamic limit
      const { data, error } = await supabaseQuery.limit(resultLimit);

      if (error) {
        console.error('Error searching courses:', error);
        return;
      }

      // If this is a very specific query (like a full course code), prioritize exact matches
      if (query.length >= 7) { // Typical full course code length (e.g., "COSC 3P32")
        const exactMatches = data?.filter(course => 
          course.course_code.toLowerCase().includes(query.toLowerCase())
        );
        
        // If we have exact matches, show them first
        if (exactMatches && exactMatches.length > 0) {
          setCourses(exactMatches);
        } else {
          setCourses(data || []);
        }
      } else {
        // For broader searches, just return all matches
        setCourses(data || []);
      }
    } catch (error) {
      console.error('Error searching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce((query: string, subject: string | null, duration: number) => {
      searchCourses(query, subject, duration);
    }, 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setSelectedSubject(null); // Clear subject selection when searching
    debouncedSearch(query, null, selectedDuration);
  };

  const handleSubjectClick = (subject: string) => {
    const newSubject = subject === selectedSubject ? null : subject;
    setSelectedSubject(newSubject);
    setSearchQuery(''); // Clear search query when selecting a subject
    
    // Cancel any pending debounced searches
    debouncedSearch.cancel();
    
    // Immediately search with the new subject
    searchCourses('', newSubject, selectedDuration);
  };

  // This is the initial enrollment handler that checks for conflicts
  const handleEnroll = async (courseId: string) => {
    setEnrollingCourse(courseId);
    setMessage(null);
    setPendingCourseId(null);
    setCourseConflicts([]);

    try {
      // Validate input values
      if (!userId || !courseId) {
        setMessage({
          text: 'Invalid user or course information.',
          type: 'error',
        });
        return;
      }

      // Get the course details for the course being enrolled
      const selectedCourse = courses.find(course => course.id === courseId);
      if (!selectedCourse) {
        setMessage({
          text: 'Course information not found. Please try again.',
          type: 'error',
        });
        return;
      }

      // Check if the course duration is valid for the current date
      if (!isCourseDurationValid(selectedCourse.course_duration)) {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const errorMessage = currentMonth >= 9 && currentMonth <= 12
          ? 'Currently Fall term (September-December), you can only register for Full Year (D1) or Fall Term (D2) courses.'
          : 'Currently Winter term (January-April), you can only register for Winter Term (D3) courses.';
        
        setMessage({
          text: errorMessage,
          type: 'error',
        });
        return;
      }

      // Validate term value
      const validTerms = ['Winter', 'Fall', 'Spring', 'Summer'];
      if (!validTerms.includes(term)) {
        console.error(`Invalid term value: ${term}`);
        setMessage({
          text: 'Invalid term value. Please refresh the page and try again.',
          type: 'error',
        });
        return;
      }

      // Check if already enrolled in this course
      if (enrolledCourseIds.has(courseId)) {
        setMessage({
          text: 'You are already enrolled in this course.',
          type: 'error',
        });
        return;
      }

      // Check for schedule conflicts with existing enrolled courses
      const conflicts = findScheduleConflicts(selectedCourse, enrolledCourses);
      
      if (conflicts.length > 0) {
        // Store conflicts and show the confirmation modal
        setCourseConflicts(conflicts);
        setPendingCourseId(courseId);
        setShowConflictModal(true);
        return;
      }

      // If no conflicts, proceed with enrollment
      await proceedWithEnrollment(courseId);

    } catch (error) {
      console.error('Error in enrollment process:', error);
      setMessage({
        text: 'An unexpected error occurred. Please try again.',
        type: 'error',
      });
    } finally {
      setEnrollingCourse(null);
    }
  };

  // Function to proceed with enrollment after conflict check or confirmation
  const proceedWithEnrollment = async (courseId: string) => {
    setEnrollingCourse(courseId);
    
    try {
      // Check how many courses the user is already enrolled in for this term
      const { data: currentEnrollments, error: enrollmentCountError } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', userId)
        .eq('term', term)
        .eq('status', 'enrolled');
      
      if (enrollmentCountError) {
        console.error('Error checking enrollment count:', enrollmentCountError);
        
        // More descriptive error message based on the error type
        let errorMessage = 'Failed to check current enrollments. Please try again.';
        if (enrollmentCountError.code === 'PGRST116') {
          errorMessage = 'Database connection error. Please try again later.';
        } else if (enrollmentCountError.message) {
          errorMessage = `Error: ${enrollmentCountError.message}`;
        }
        
        setMessage({
          text: errorMessage,
          type: 'error',
        });
        return;
      }

      // Ensure currentEnrollments is an array even if data is null
      const enrollmentCount = Array.isArray(currentEnrollments) ? currentEnrollments.length : 0;
      
      // Determine the maximum courses allowed based on the term
      const maxCoursesAllowed = term === 'Spring' ? 4 : 7;
      
      console.log(`Current enrollment count: ${enrollmentCount}, Max allowed: ${maxCoursesAllowed}, Term: ${term}`);
      
      // Check if the user is already at or over the limit
      if (enrollmentCount >= maxCoursesAllowed) {
        setMessage({
          text: `You've reached the maximum limit of ${maxCoursesAllowed} courses for ${term} term.`,
          type: 'error',
        });
        return;
      }

      // Create new enrollment
      const { error } = await supabase.from('enrollments').insert({
        user_id: userId,
        course_id: courseId,
        term,
        status: 'enrolled',
      });

      if (error) {
        console.error('Error enrolling in course:', error);
        setMessage({
          text: 'Failed to enroll in course. Please try again.',
          type: 'error',
        });
        return;
      }

      // Get the enrolled course details and add to local state
      const { data: courseDetails } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
      
      if (courseDetails) {
        setEnrolledCourses(prev => [...prev, courseDetails]);
      }

      // Update enrolled course IDs
      setEnrolledCourseIds(prev => {
        const updated = new Set(prev);
        updated.add(courseId);
        return updated;
      });

      setMessage({
        text: 'Successfully enrolled in course!',
        type: 'success',
      });
      
      // Reset states
      setPendingCourseId(null);
      setCourseConflicts([]);
      
      // Refresh the server components
      router.refresh();
    } catch (error) {
      console.error('Error enrolling in course:', error);
      setMessage({
        text: 'An unexpected error occurred. Please try again.',
        type: 'error',
      });
    } finally {
      setEnrollingCourse(null);
    }
  };

  const handleDrop = async (courseId: string) => {
    setDroppingCourse(courseId);
    setMessage(null);

    try {
      // Validate input values
      if (!userId || !courseId) {
        setMessage({
          text: 'Invalid user or course information.',
          type: 'error',
        });
        return;
      }

      // Validate term value
      const validTerms = ['Winter', 'Fall', 'Spring', 'Summer'];
      if (!validTerms.includes(term)) {
        console.error(`Invalid term value: ${term}`);
        setMessage({
          text: 'Invalid term value. Please refresh the page and try again.',
          type: 'error',
        });
        return;
      }

      // Find the enrollment record
      const { data: enrollmentData, error: findError } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('term', term)
        .eq('status', 'enrolled')
        .single();

      if (findError) {
        console.error('Error finding enrollment:', findError);
        setMessage({
          text: 'Could not find your enrollment record.',
          type: 'error',
        });
        return;
      }

      // Delete the enrollment record completely
      const { error: deleteError } = await supabase
        .from('enrollments')
        .delete()
        .eq('id', enrollmentData.id);

      if (deleteError) {
        console.error('Error dropping course:', deleteError);
        setMessage({
          text: 'Failed to drop course. Please try again.',
          type: 'error',
        });
        return;
      }

      // Update local state
      setEnrolledCourseIds(prev => {
        const updated = new Set(prev);
        updated.delete(courseId);
        return updated;
      });

      setMessage({
        text: 'Successfully removed the course from your enrollments!',
        type: 'success',
      });
      
      // Refresh the server components
      router.refresh();
    } catch (error) {
      console.error('Error dropping course:', error);
      setMessage({
        text: 'An unexpected error occurred. Please try again.',
        type: 'error',
      });
    } finally {
      setDroppingCourse(null);
    }
  };

  // Function to format the schedule display
  const formatSchedule = (days?: string, time?: string, type?: string) => {
    const parts = [];
    if (days) parts.push(days);
    if (time) parts.push(time);
    if (type) parts.push(`(${type})`);
    
    return parts.length > 0 ? parts.join(' - ') : 'Schedule not specified';
  };

  // Safe format date function to handle undefined values
  const safeFormatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return formatDate(dateStr);
  };

  // Add an effect to listen for the custom suggestion event
  useEffect(() => {
    // Function to handle the suggestion selected event
    const handleSuggestionSelected = (event: CustomEvent) => {
      const { courseCode } = event.detail;
      
      // Update the search query state
      setSearchQuery(courseCode);
      setSelectedSubject(null);
      
      // Cancel any pending debounced searches and perform an immediate search
      debouncedSearch.cancel();
      searchCourses(courseCode, null, selectedDuration);
    };

    // Add event listener for the custom event
    document.addEventListener('suggestionSelected', handleSuggestionSelected as EventListener);
    
    // Cleanup - remove event listener when component unmounts
    return () => {
      document.removeEventListener('suggestionSelected', handleSuggestionSelected as EventListener);
    };
  }, [debouncedSearch, selectedDuration]); // Include dependencies

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Search Courses</h2>
        
        {/* Popular Subjects */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Popular Subjects:</p>
          <div className="flex flex-wrap gap-2">
            {popularSubjects.map((subject) => (
              <button
                key={subject.code}
                onClick={() => handleSubjectClick(subject.code)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                  ${
                    selectedSubject === subject.code
                      ? 'bg-teal-600 text-white dark:bg-teal-500'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                  }`}
              >
                {subject.code}
              </button>
            ))}
          </div>
        </div>

        {/* Duration Filter */}
        <div className="mb-4">
          <select
            value={selectedDuration}
            onChange={(e) => {
              const duration = parseInt(e.target.value);
              setSelectedDuration(duration);
              // Trigger search with new duration
              searchCourses(searchQuery, selectedSubject, duration);
            }}
            className="w-full md:w-48 p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-gray-700 dark:text-gray-200 dark:bg-gray-800"
          >
            <option value={0}>All Durations</option>
            <option value={1}>Full Year</option>
            <option value={2}>Fall Term</option>
            <option value={3}>Winter Term</option>
          </select>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Enter course code (e.g., COSC 4P02)"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all dark:bg-gray-800 dark:text-gray-100"
              autoComplete="off"
            />
            {loading && (
              <div className="absolute right-3 top-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-500 dark:border-teal-400"></div>
              </div>
            )}
          </div>

          {message && (
            <div
              className={`p-4 rounded-md ${
                message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
      </div>

      {courses.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">
            Found {courses.length} course{courses.length !== 1 ? 's' : ''}
          </h3>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {courses.map((course) => {
              const isEnrolled = enrolledCourseIds.has(course.id);
              const durationInfo = getDurationInfo(course.course_duration);
              const courseTypeInfo = getCourseTypeInfo(course.class_type);
              
              return (
                <div key={course.id} className="py-6 first:pt-0 last:pb-0">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                          {course.course_code}
                        </h3>
                        
                        {courseTypeInfo && (
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            courseTypeInfo.isOnline 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' 
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {courseTypeInfo.description}
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-3 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-x-6 text-sm">
                          <p className="flex items-center text-gray-600 dark:text-gray-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formatSchedule(course.course_days, course.class_time, '')}
                          </p>
                          
                          {course.instructor && (
                            <p className="flex items-center text-gray-600 dark:text-gray-300">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              {course.instructor}
                            </p>
                          )}
                        </div>
                        
                        {(course.start_date || course.end_date) && (
                          <p className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {course.start_date && course.end_date 
                              ? `${safeFormatDate(course.start_date)} - ${safeFormatDate(course.end_date)}`
                              : course.start_date 
                                ? `Starts: ${safeFormatDate(course.start_date)}`
                                : `Ends: ${safeFormatDate(course.end_date)}`
                            }
                          </p>
                        )}
                        
                        {courseTypeInfo && (
                          <p className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                            {courseTypeInfo.icon}
                            <span>
                              <span className="font-medium">{courseTypeInfo.description}</span>
                              {courseTypeInfo.isOnline && 
                                <span className="ml-1 px-1.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded">
                                  ONLINE
                                </span>
                              }
                            </span>
                          </p>
                        )}
                        
                        {durationInfo && (
                          <p className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                            {durationInfo.icon}
                            <span>
                              <span className="font-medium">{durationInfo.description}</span>
                              {durationInfo.period && <span className="ml-1">({durationInfo.period})</span>}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4 md:mt-0">
                      {isEnrolled ? (
                        <button
                          onClick={() => handleDrop(course.id)}
                          disabled={droppingCourse === course.id}
                          className={`px-6 py-3 rounded-md text-white shadow-sm hover:shadow-md transition-all w-full md:w-auto ${
                            droppingCourse === course.id
                              ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                              : 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600'
                          }`}
                        >
                          {droppingCourse === course.id ? (
                            <span className="flex items-center justify-center">
                              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                              Dropping...
                            </span>
                          ) : (
                            'Drop Course'
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEnroll(course.id)}
                          disabled={enrollingCourse === course.id}
                          className={`px-6 py-3 rounded-md text-white shadow-sm hover:shadow-md transition-all w-full md:w-auto ${
                            enrollingCourse === course.id
                              ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                              : 'bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600'
                          }`}
                        >
                          {enrollingCourse === course.id ? (
                            <span className="flex items-center justify-center">
                              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                              Enrolling...
                            </span>
                          ) : (
                            'Enroll'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : searchQuery.length > 1 && !loading ? (
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">No courses found</h3>
          <p className="text-gray-600 dark:text-gray-300">Try a different search term</p>
        </div>
      ) : null}

      {/* Schedule Conflict Modal */}
      {showConflictModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75 dark:bg-gray-900 dark:opacity-80"></div>
            </div>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 sm:mx-0 sm:h-10 sm:w-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600 dark:text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                      Schedule Conflict Detected
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-300">
                        There {courseConflicts.length === 1 ? 'is' : 'are'} {courseConflicts.length} scheduling conflict{courseConflicts.length !== 1 ? 's' : ''} with your currently enrolled courses:
                      </p>
                      <div className="mt-4 space-y-3">
                        {courseConflicts.map((conflict) => (
                          <div key={conflict.id} className="border border-gray-200 dark:border-gray-700 rounded-md p-3 bg-gray-50 dark:bg-gray-700/50">
                            <p className="font-medium text-gray-700 dark:text-gray-200">{conflict.course_code}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              {conflict.course_days} - {conflict.class_time}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {conflict.instructor && (`Instructor: ${conflict.instructor}`)}
                            </p>
                          </div>
                        ))}
                      </div>
                      <p className="mt-4 text-sm text-red-600 dark:text-red-400 font-medium">
                        Are you sure you want to enroll in this course despite the schedule conflict?
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => {
                    if (pendingCourseId) {
                      setShowConflictModal(false);
                      proceedWithEnrollment(pendingCourseId);
                    }
                  }}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-yellow-600 dark:bg-yellow-700 text-base font-medium text-white hover:bg-yellow-700 dark:hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 dark:focus:ring-yellow-400 dark:focus:ring-offset-gray-800 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Enroll Anyway
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowConflictModal(false);
                    setPendingCourseId(null);
                    setCourseConflicts([]);
                    setEnrollingCourse(null);
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 dark:focus:ring-offset-gray-800 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 