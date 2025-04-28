'use client';

import Image from 'next/image';
import Link from 'next/link';
import { UserProfile as UserProfileType, Program, ExtendedTermInfo } from '@/types';
import DegreeProgress from './DegreeProgress';
import Deadlines from './Deadlines';

interface UserProfileProps {
  userProfile: UserProfileType;
  program: Program;
  termInfo: ExtendedTermInfo;
  academicProgress?: {
    currentAverage: number;
    completedCourses: number;
  };
}

export default function UserProfile({ userProfile, program, termInfo, academicProgress }: UserProfileProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-5 sm:p-6 flex flex-col h-full w-full">
      {/* Profile Section - More compact on mobile */}
      <div className="flex flex-col items-center">
        {/* Profile Image */}
        <div className="relative w-16 h-16 sm:w-24 sm:h-24 mb-2 sm:mb-3">
          <div className="w-full h-full rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
            <svg
              className="w-10 h-10 sm:w-16 sm:h-16 text-gray-400 dark:text-gray-500"
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
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">
          {userProfile.first_name} {userProfile.last_name}
        </h2>

        {/* Program - Smaller on mobile */}
        <div className="mb-2 max-w-full">
          <div className="flex items-center justify-center mb-1 text-gray-500 dark:text-gray-400">
            <svg
              className="w-3 h-3 sm:w-4 sm:h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <span className="text-xs">Program</span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 text-center px-3 break-words">
            {program.program_name}
          </p>
        </div>

        {/* Student Number - Smaller on mobile */}
        {userProfile.student_number && (
          <div className="mb-1 max-w-full">
            <div className="flex items-center justify-center mb-1 text-gray-500 dark:text-gray-400">
              <svg
                className="w-3 h-3 sm:w-4 sm:h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                />
              </svg>
              <span className="text-xs">Student ID</span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
              {userProfile.student_number}
            </p>
          </div>
        )}
      </div>

      {/* Current Term - More compact on mobile */}
      <div className="w-full mt-4 sm:mt-6 mb-3 sm:mb-4 bg-gray-50 dark:bg-gray-700 rounded-md p-3 sm:p-4">
        <h3 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Current Term</h3>
        <div className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2 sm:mb-3">
          {termInfo.displayName}
        </div>
        
        {/* Term Progress */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Term Progress</span>
            <span>{Math.round(termInfo.progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div
              className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full"
              style={{ width: `${termInfo.progress}%` }}
            ></div>
          </div>
          <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mt-1 font-medium">
            {termInfo.daysRemaining} days remaining
          </div>
        </div>

        {/* Reading Week Status */}
        <div>
          <h4 className="text-xs text-gray-500 dark:text-gray-400 mb-1">Reading Week</h4>
          <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium">
            {termInfo.readingWeekStatus}
          </div>
        </div>
      </div>

      {/* Quick Stats - More compact on mobile */}
      <div className="w-full mb-3 sm:mb-4">
        <h3 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">Quick Stats</h3>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-2 sm:p-3 space-y-1 sm:space-y-2">
          <div className="flex justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">Current Average</span>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {academicProgress?.currentAverage 
                ? `${academicProgress.currentAverage.toFixed(1)}%` 
                : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">Courses Completed</span>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {academicProgress?.completedCourses ?? 0}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">Courses This Term</span>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{termInfo.coursesThisTerm}</span>
          </div>
        </div>
      </div>

      {/* Degree Progress - Using the new component */}
      <div className="w-full mb-3 sm:mb-4 hidden sm:block">
        <h3 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">Degree Progress</h3>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-2 sm:p-3">
          <DegreeProgress 
            userId={userProfile.user_id} 
            completedCourses={academicProgress?.completedCourses || 0} 
          />
        </div>
      </div>

      {/* Deadlines - Using the new component */}
      <div className="w-full mb-3 sm:mb-4 hidden sm:block">
        <Deadlines userId={userProfile.user_id} />
      </div>

      {/* Navigation Links - Adjusted for mobile */}
      <div className="w-full space-y-1.5 sm:space-y-2 mt-auto">
        <Link 
          href="/protected/my-courses" 
          className="block w-full text-center py-1.5 sm:py-2 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
        >
          My Courses
        </Link>
        <Link 
          href="/protected/academic-progress" 
          className="block w-full text-center py-1.5 sm:py-2 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
        >
          Academic Progress
        </Link>
        <Link 
          href="/protected/course-registration" 
          className="block w-full text-center py-1.5 sm:py-2 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
        >
          Course Registration
        </Link>
      </div>
    </div>
  );
} 