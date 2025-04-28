import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { encryptGrade } from '@/utils/grade-utils';
import { toast } from 'sonner';

type GradeEntryFormProps = {
  userId: string;
  courseCode: string;
  requirementId: string;
  requirementType: string;
  existingGrade?: string;
  existingTerm?: string;
  existingYear?: number;
  onGradeUpdated: () => void;
};

export default function GradeEntryForm({
  userId,
  courseCode,
  requirementId,
  requirementType,
  existingGrade = '',
  existingTerm = '',
  existingYear = new Date().getFullYear(),
  onGradeUpdated
}: GradeEntryFormProps) {
  const [grade, setGrade] = useState(existingGrade);
  const [term, setTerm] = useState(existingTerm);
  const [year, setYear] = useState(existingYear);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - i);
  
  const termOptions = [
    { value: 'Fall', label: 'Fall' },
    { value: 'Winter', label: 'Winter' },
    { value: 'Spring', label: 'Spring' },
    { value: 'Summer', label: 'Summer' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const supabase = createClient();
      
      // Create a formatted display for the requirement type
      const formattedRequirementType = requirementType
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
      
      // Encrypt the grade before storing it
      const encryptedGrade = encryptGrade(grade, userId);
      
      // Check if a grade already exists for this requirement
      const { data: existingRecord } = await supabase
        .from('student_grades')
        .select('id')
        .eq('user_id', userId)
        .eq('requirement_id', requirementId)
        .maybeSingle();
      
      let result;
      
      if (existingRecord) {
        // Update existing record
        result = await supabase
          .from('student_grades')
          .update({
            grade: encryptedGrade,
            term,
            year,
            status: grade ? 'completed' : 'in-progress',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRecord.id);
      } else {
        // Create new record
        result = await supabase
          .from('student_grades')
          .insert({
            user_id: userId,
            course_code: courseCode,
            requirement_id: requirementId,
            grade: encryptedGrade,
            term,
            year,
            status: grade ? 'completed' : 'in-progress'
          });
      }
      
      if (result.error) {
        throw result.error;
      }
      
      toast.success(`Grade saved for ${courseCode} (${formattedRequirementType})`);
      onGradeUpdated();
    } catch (error) {
      console.error('Error saving grade:', error);
      toast.error('Failed to save grade. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col space-y-1">
        <label htmlFor="grade" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Grade
        </label>
        <input
          id="grade"
          type="text"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-700 dark:text-gray-100"
          placeholder="Enter grade (e.g., A, B+, 85)"
        />
      </div>
      
      <div className="flex flex-col space-y-1">
        <label htmlFor="term" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Term
        </label>
        <select
          id="term"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-700 dark:text-gray-100"
          required
        >
          <option value="">Select Term</option>
          {termOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      
      <div className="flex flex-col space-y-1">
        <label htmlFor="year" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Year
        </label>
        <select
          id="year"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-700 dark:text-gray-100"
          required
        >
          <option value="">Select Year</option>
          {yearOptions.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
      
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 dark:bg-blue-700 dark:hover:bg-blue-600 dark:disabled:bg-blue-800 dark:focus:ring-blue-400 dark:focus:ring-offset-gray-800"
      >
        {isSubmitting ? 'Saving...' : 'Save Grade'}
      </button>
    </form>
  );
}