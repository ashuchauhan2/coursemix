'use client';

import { useState } from 'react';
import CourseCard from "./CourseCard";
import WorkTermCard from "./WorkTermCard";

interface Course {
  id: string;
  program_id: number;
  year: number;
  course_code: string;
  credit_weight: number;
  requirement_type: string;
  min_grade?: number;
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

interface WorkTerm {
  id: string;
  user_id: string;
  term_name: string;
  company_name?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

type CourseListProps = {
  courses: Course[];
  grades: StudentGrade[];
  decryptedGrades: { [id: string]: string };
  userId: string;
  isCoopProgram: boolean;
  workTerms?: WorkTerm[];
};

export default function CourseList({ 
  courses, 
  grades, 
  decryptedGrades, 
  userId, 
  isCoopProgram, 
  workTerms = [] 
}: CourseListProps) {
  // Organize courses by year
  const coursesByYear = courses.reduce<{ [year: number]: Course[] }>(
    (acc, course) => {
      const year = course.year || 1;
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(course);
      return acc;
    },
    {}
  );

  // Find a grade for a specific requirement
  const findGradeForRequirement = (requirementId: string) => {
    return grades.find(grade => grade.requirement_id === requirementId);
  };

  // Find a work term for a specific term name
  const findWorkTerm = (termName: string) => {
    return workTerms.find(workTerm => workTerm.term_name === termName);
  };

  const years = Object.keys(coursesByYear)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-8">
      {/* Add Work Terms section for co-op programs */}
      {isCoopProgram && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Co-op Work Terms</h2>
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
            {/* SCIE 0N90 Course Card */}
            <WorkTermCard
              termName="SCIE 0N90"
              userId={userId}
              status={findWorkTerm("SCIE 0N90")?.status}
              isScieWorkshop={true}
              workTermId={findWorkTerm("SCIE 0N90")?.id}
            />
            
            {/* Work Term Cards */}
            {["Work Term 1", "Work Term 2", "Work Term 3"].map((termName) => {
              const workTerm = findWorkTerm(termName);
              return (
                <WorkTermCard
                  key={termName}
                  termName={termName}
                  userId={userId}
                  status={workTerm?.status}
                  companyName={workTerm?.company_name}
                  workTermId={workTerm?.id}
                />
              );
            })}
          </div>
        </div>
      )}
      
      {/* Existing year-by-year course listings */}
      {years.map((year) => (
        <div key={year} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Year {year}</h2>
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {coursesByYear[year].map((course) => {
              // Find grade for this specific requirement
              const gradeRecord = findGradeForRequirement(course.id);
              const gradeDisplay = gradeRecord ? decryptedGrades[gradeRecord.id] : '';
              
              return (
                <CourseCard
                  key={course.id}
                  courseCode={course.course_code}
                  creditWeight={course.credit_weight}
                  minGrade={course.min_grade?.toString()}
                  requirementType={course.requirement_type}
                  existingGrade={gradeDisplay}
                  userId={userId}
                  gradeId={gradeRecord?.id}
                  requirementId={course.id}
                  status={gradeRecord?.status}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}