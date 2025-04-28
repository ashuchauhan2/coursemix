'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

interface DegreeProgressProps {
  userId: string;
  completedCourses: number;
}

export default function DegreeProgress({ userId, completedCourses }: DegreeProgressProps) {
  const [inProgressCourses, setInProgressCourses] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Standard number of courses required for a degree
  const totalRequiredCourses = 40;
  
  // Calculate percentages
  const percentComplete = Math.min(100, Math.round((completedCourses / totalRequiredCourses) * 100));
  const percentInProgress = Math.min(100 - percentComplete, Math.round((inProgressCourses / totalRequiredCourses) * 100));
  
  useEffect(() => {
    async function fetchInProgressCourses() {
      if (!userId) return;
      
      setIsLoading(true);
      const supabase = createClient();
      
      try {
        const { data, error } = await supabase
          .from('student_grades')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'in-progress');
        
        if (error) throw error;
        
        setInProgressCourses(data?.length || 0);
      } catch (err) {
        console.error('Error fetching in-progress courses:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchInProgressCourses();
  }, [userId]);
  
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
        <span>Completion</span>
        <span>
          {percentComplete}% Complete
          {inProgressCourses > 0 && !isLoading && (
            <span className="text-blue-600 dark:text-blue-400 ml-1">
              (+{percentInProgress}% In Progress)
            </span>
          )}
        </span>
      </div>
      
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2 overflow-hidden">
        <div className="flex h-2">
          <div 
            className={`bg-teal-600 dark:bg-teal-500 h-2 transition-all duration-500 ease-in-out ${inProgressCourses === 0 ? 'rounded-full' : 'rounded-l-full'}`}
            style={{ width: `${percentComplete}%` }}
          ></div>
          {inProgressCourses > 0 && !isLoading && (
            <div 
              className="bg-blue-500 h-2 transition-all duration-500 ease-in-out rounded-r-full" 
              style={{ width: `${percentInProgress}%` }}
            ></div>
          )}
        </div>
      </div>
      
      <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
        {completedCourses} / {totalRequiredCourses} courses completed
        {inProgressCourses > 0 && !isLoading && (
          <span className="text-blue-600 dark:text-blue-400 ml-1">
            ({inProgressCourses} in progress)
          </span>
        )}
      </div>
    </div>
  );
} 