'use client';

import { useState, useMemo, useEffect } from 'react';
import { formatTime } from '@/utils/date-utils';
import { Course, OnlineCourseType } from '@/types';

// Constants for timetable
const TIMETABLE_START = 7; // 7 AM
const HOURS_COUNT = 16; // 7 AM to 10 PM
const ONLINE_COURSE_TYPES = ['ASY', 'ASO', 'SYN', 'SYO', 'ONM', 'HYF', 'PRO'];

interface TimetableProps {
  activeCourses: Course[];
}

// Helper function to parse time string (e.g., "10:00-11:50" or "900 -1200")
function parseTime(timeString?: string) {
  if (!timeString) return null;
  
  // Remove any spaces within the time string
  const cleanedTimeString = timeString.replace(/\s+/g, '');
  
  const [startTime, endTime] = cleanedTimeString.split('-');
  if (!startTime || !endTime) return null;
  
  let startHour, startMinute, endHour, endMinute;
  
  // Handle both formats: "10:00" and "1000"
  if (startTime.includes(':')) {
    [startHour, startMinute] = startTime.split(':').map(Number);
  } else {
    // For format like "900", "1000", "1900"
    if (startTime.length <= 2) {
      startHour = Number(startTime);
      startMinute = 0;
    } else if (startTime.length === 3) {
      startHour = Number(startTime.substring(0, 1));
      startMinute = Number(startTime.substring(1));
    } else {
      startHour = Number(startTime.substring(0, 2));
      startMinute = Number(startTime.substring(2));
    }
  }
  
  // Handle both formats: "11:50" and "1150"
  if (endTime.includes(':')) {
    [endHour, endMinute] = endTime.split(':').map(Number);
  } else {
    // For format like "1200", "1150", "2200"
    if (endTime.length <= 2) {
      endHour = Number(endTime);
      endMinute = 0;
    } else if (endTime.length === 3) {
      endHour = Number(endTime.substring(0, 1));
      endMinute = Number(endTime.substring(1));
    } else {
      endHour = Number(endTime.substring(0, 2));
      endMinute = Number(endTime.substring(2));
    }
  }
  
  if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
    console.log(`Invalid time format: ${timeString}`);
    return null;
  }
  
  // Debug log to verify parsing
  console.log(`Parsed time for ${timeString}: startHour=${startHour}, startMinute=${startMinute}, endHour=${endHour}, endMinute=${endMinute}`);
  
  return {
    startHour,
    startMinute,
    endHour,
    endMinute
  };
}

// Calculate position and height for course blocks
function calculateCoursePosition(timeObj: ReturnType<typeof parseTime>) {
  if (!timeObj) return { top: 0, height: 0 };
  
  const { startHour, startMinute, endHour, endMinute } = timeObj;
  
  // Calculate position as percentage of the timetable
  const startPosition = ((startHour - TIMETABLE_START) + (startMinute / 60)) / HOURS_COUNT * 100;
  const endPosition = ((endHour - TIMETABLE_START) + (endMinute / 60)) / HOURS_COUNT * 100;
  
  return {
    top: startPosition,
    height: endPosition - startPosition
  };
}

export default function Timetable({ activeCourses }: TimetableProps) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Log courses for debugging
  useEffect(() => {
    if (isClient) {
      console.log('Active courses in Timetable component:', activeCourses);
    }
  }, [activeCourses, isClient]);

  // Log time parsing for debugging
  useEffect(() => {
    if (isClient) {
      console.log('Active courses in Timetable component:', activeCourses);
      activeCourses.forEach(course => {
        if (course.class_time) {
          console.log(`Parsing time for ${course.course_code}: ${course.class_time}`);
          const parsed = parseTime(course.class_time);
          if (parsed) {
            const { top, height } = calculateCoursePosition(parsed);
            console.log(`Position calculated: top=${top}%, height=${height}%`);
          } else {
            console.log(`Failed to parse time for ${course.course_code}`);
          }
        }
      });
    }
  }, [activeCourses, isClient]);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const dayAbbreviations = {
    'Monday': 'Mon',
    'Tuesday': 'Tue',
    'Wednesday': 'Wed',
    'Thursday': 'Thu',
    'Friday': 'Fri'
  };
  
  const dayLetterMapping = {
    'Monday': 'M',
    'Tuesday': 'T',
    'Wednesday': 'W',
    'Thursday': 'R',
    'Friday': 'F'
  };

  // Check for online courses that don't have class times
  const onlineCourses = activeCourses.filter(
    course => !course.class_time || ONLINE_COURSE_TYPES.includes(course.class_type as OnlineCourseType)
  );
  
  const hasOnlineCourses = onlineCourses.length > 0;

  if (!isClient) {
    return <div className="w-full h-[calc(100vh-8rem)] flex items-center justify-center">Loading...</div>;
  }

  // Early return for empty state
  if (activeCourses.length === 0) {
    return (
      <div className="w-full h-[calc(100vh-8rem)] max-w-5xl mx-auto p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg flex flex-col items-center justify-center">
        <svg className="w-16 h-16 mb-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-lg font-medium text-gray-500 dark:text-gray-400">No courses found for this term</p>
        <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">Visit the Course Registration page to enroll in courses</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-8rem)] max-w-5xl mx-auto p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="flex flex-col h-full">
        <div className="grid grid-cols-6 flex-grow">
          {/* Time Labels */}
          <div className="relative border-r border-gray-200 dark:border-gray-700">
            <div className="h-12 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"></div>
            <div className="relative h-[calc(100%-3rem)]">
              {Array.from({ length: HOURS_COUNT }, (_, i) => {
                const hour = TIMETABLE_START + i;
                // Skip rendering the 7am label
                if (hour === 7) return null;
                return (
                  <div
                    key={i}
                    className={`absolute w-full text-xs font-semibold pr-2 flex items-center justify-end ${
                      hour < 8 ? "text-gray-400 dark:text-gray-500" : "text-gray-600 dark:text-gray-400"
                    }`}
                    style={{
                      top: `${(i / HOURS_COUNT) * 100}%`,
                      height: `${(1 / HOURS_COUNT) * 100}%`,
                      transform: "translateY(-50%)",
                    }}
                  >
                    {formatTime(hour, 0)}
                    <div className="absolute right-0 w-2 h-[1px] bg-gray-500 dark:bg-gray-400" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day Columns */}
          {days.map((day) => {
            const dayLetter = dayLetterMapping[day as keyof typeof dayLetterMapping];
            const coursesForDay = activeCourses.filter((course) => 
              course.course_days && 
              // Clean spaces and check if the day letter is included
              course.course_days.replace(/\s+/g, '').includes(dayLetter) && 
              course.class_time
            );

            console.log(`Courses for ${day} (${dayLetter}):`, coursesForDay);

            return (
              <div key={day} className="relative border-r border-gray-200 dark:border-gray-700">
                {/* Day Header */}
                <div className="h-12 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <span className="hidden sm:inline">{day}</span>
                    <span className="sm:hidden">{dayAbbreviations[day as keyof typeof dayAbbreviations]}</span>
                  </span>
                </div>

                {/* Course Container */}
                <div className="relative h-[calc(100%-3rem)]">
                  {/* Hour Grid Lines */}
                  {Array.from({ length: HOURS_COUNT }, (_, i) => (
                    <div key={`grid-${i}`}>
                      <div
                        className={`absolute w-full border-t ${
                          TIMETABLE_START + i === 8
                            ? "border-gray-300 dark:border-gray-600"
                            : "border-gray-200 dark:border-gray-700"
                        }`}
                        style={{ top: `${(i / HOURS_COUNT) * 100}%` }}
                      />
                      <div
                        className="absolute w-full border-t border-gray-100 dark:border-gray-700 border-dashed"
                        style={{ top: `${((i + 0.5) / HOURS_COUNT) * 100}%` }}
                      />
                    </div>
                  ))}

                  {/* Add final border line at bottom */}
                  <div
                    className="absolute w-full border-t border-gray-300 dark:border-gray-600"
                    style={{ bottom: "0" }}
                  />

                  {/* Pre-8am shaded area with "No Classes" text */}
                  <div
                    className="absolute w-full bg-gray-50/50 dark:bg-gray-700/50 flex items-center justify-center"
                    style={{
                      top: 0,
                      height: `${(1 / HOURS_COUNT) * 100}%`,
                    }}
                  >
                    <span className="text-[10px] text-gray-600 dark:text-gray-400 font-bold">
                      <p className="">No Classes</p>
                    </span>
                  </div>

                  {/* Course Blocks */}
                  {coursesForDay.map((course) => {
                    const timeObj = parseTime(course.class_time);
                    
                    if (!timeObj) {
                      console.log(`No time object for ${course.course_code} - ${course.class_time}`);
                      return null;
                    }
                    
                    const { top, height } = calculateCoursePosition(timeObj);
                    
                    if (top === 0 && height === 0) {
                      console.log(`Zero position for ${course.course_code}: top=${top}, height=${height}`);
                      return null;
                    }
                    
                    // Generate a deterministic color based on course code
                    const colorHash = course.course_code
                      .split("")
                      .reduce((acc, char) => char.charCodeAt(0) + acc, 0);
                    const hue = colorHash % 190;
                    
                    // console.log(`Rendering course ${course.course_code} at top=${top}%, height=${height}%`);
                  

                    return (
                      <div
                        key={`${course.id}-${course.enrollment_id}`}
                        className="absolute rounded-md overflow-hidden shadow-sm backdrop-blur-sm 
                                  border-l-4 w-[95%] mx-auto left-0 right-0
                                  transition-transform hover:scale-[1.02] cursor-pointer
                                  flex flex-col dark:shadow-gray-900"
                        style={{
                          top: `${top}%`,
                          height: `${height}%`,
                          backgroundColor: `hsl(${hue}, 97%, 37%)`,
                          borderColor: `hsla(${hue}, 70%, 60%, 1)`,
                          padding: height < 8 ? '1px 3px' : '3px 4px',
                          fontSize: height < 10 ? '0.65rem' : '0.75rem',
                        }}
                      >
                        <div className="font-bold truncate text-gray-800 dark:text-gray-900 leading-tight">
                          {course.course_code}
                        </div>
                        
                        {/* Always show course type */}
                        <div className="truncate text-gray-900 leading-tight" 
                            style={{ fontSize: height < 10 ? '0.6rem' : '0.65rem' }}>
                          {course.class_type}
                        </div>

                        {/* Always show instructor but adjust for small blocks */}
                        {course.instructor && (
                          <div className="truncate text-gray-900 mt-auto leading-tight" 
                              style={{ fontSize: height < 10 ? '0.55rem' : '0.6rem' }}>
                            {height <= 10 
                              ? course.instructor.split(",")[0] // Just last name for very small blocks
                              : course.instructor.split(",").length > 1 
                                ? `${course.instructor.split(",")[0]}` // Just last name for medium blocks
                                : course.instructor // Full name for larger blocks
                            }
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Post-10pm shaded area with "No Classes" text */}
                  <div
                    className="absolute w-full bg-gray-50/50 dark:bg-gray-700/50 flex items-center justify-center"
                    style={{
                      bottom: 0,
                      height: `${(1 / HOURS_COUNT) * 100}%`,
                    }}
                  >
                    <span className="text-[10px] text-gray-600 dark:text-gray-400 font-bold">
                      <p className="">No Classes</p>
                    </span>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* Online Courses Section */}
        {hasOnlineCourses && (
          <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Online Courses
            </h3>
            <div className="flex flex-wrap gap-2">
              {onlineCourses.map((course) => {
                const colorHash = course.course_code
                  .split("")
                  .reduce((acc, char) => char.charCodeAt(0) + acc, 0);
                const hue = colorHash % 360;

                return (
                  <div
                    key={course.id || course.enrollment_id}
                    className="p-2 rounded-md shadow-sm backdrop-blur-sm 
                              border-l-4 transition-transform hover:scale-[1.02] cursor-pointer
                              flex flex-col dark:shadow-gray-900"
                    style={{
                      backgroundColor: `hsl(${hue}, 97%, 37%)`,
                      borderColor: `hsla(${hue}, 70%, 60%, 1)`,
                      minWidth: '180px',
                    }}
                  >
                    <div className="font-bold text-gray-800 dark:text-gray-900">
                      {course.course_code}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-800 mt-1">
                      {course.class_type === "ASY" ? "Asynchronous Online" :
                      course.class_type === "ASO" ? "Asynchronous Online, In-Person Exam" :
                      course.class_type === "SYN" ? "Synchronous Online" :
                      course.class_type === "SYO" ? "Synchronous Online, In-Person Exam" :
                      course.class_type === "ONM" ? "Online Mixed" :
                      course.class_type === "HYF" ? "Hybrid Flexible" :
                      course.class_type === "PRO" ? "Project Course" :
                      "Online"}
                    </div>
                    {course.instructor && (
                      <div className="text-xs text-gray-500 dark:text-gray-900 mt-1">
                        {course.instructor}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 