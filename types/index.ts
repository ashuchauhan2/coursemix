export interface Feature {
  icon: string;
  title: string;
  description: string;
}

export type Term = 'FALL' | 'WINTER' | 'SPRING' | 'SUMMER';

export interface TermInfo {
  term: Term;
  year: number;
  displayName: string;
}

export interface ExtendedTermInfo extends TermInfo {
  daysRemaining: number;
  progress: number;
  readingWeekStatus: string;
  coursesThisTerm: number;
}

export type OnlineCourseType = 'ASY' | 'ASO' | 'SYN' | 'SYO' | 'ONM' | 'HYF' | 'PRO';

export interface Course {
  id: string;
  course_code: string;
  course_days?: string;
  class_time?: string;
  class_type?: string;
  instructor?: string;
  enrollment_id?: string;
  start_date?: string;
  end_date?: string;
  course_duration?: number;
}

export interface UserProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  student_number?: string;
  program_id: number;
  target_average?: number;
  is_profile_setup: boolean;
  created_at: string;
  updated_at: string;
}

export interface Program {
  id: number;
  program_name: string;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  term: Term;
  year: number;
  status: 'active' | 'dropped' | 'completed';
  created_at: string;
  updated_at: string;
}

// Grade related types
export interface StudentGrade {
  id: string;
  user_id: string;
  course_code: string;
  grade: string; // Encrypted grade string
  term: string;
  year: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DecryptedGrade {
  id: string;
  course_code: string;
  grade: string; // Clear text grade
  decrypted_grade?: string;
  term: string;
  year: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AcademicProgressSummary {
  completedCourses: number;
  inProgressCourses: number;
  plannedCourses: number;
  remainingCourses: number;
  overallGPA: number;
  percentComplete: number;
}

export interface CoursePrerequisite {
  id: string;
  course_code: string;
  prerequisite_code: string;
  min_grade?: number | null;
  created_at: string;
} 