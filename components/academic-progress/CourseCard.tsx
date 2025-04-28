"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { saveGradeAction, deleteGradeAction, forceDeleteGradeAction, toggleCourseStatusAction } from "@/app/academic-progress-actions";
import { useRouter } from "next/navigation";
import { Plus, Minus } from "lucide-react";

interface CourseCardProps {
  courseCode: string;
  creditWeight: number;
  minGrade?: string;
  requirementType?: string;
  existingGrade?: string;
  userId: string;
  gradeId?: string;
  status?: string;
  requirementId?: string;
}

export default function CourseCard({
  courseCode,
  creditWeight,
  minGrade,
  requirementType,
  existingGrade,
  userId,
  gradeId,
  status,
  requirementId,
}: CourseCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [grade, setGrade] = useState(existingGrade || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasGrade, setHasGrade] = useState(!!existingGrade);
  const [courseStatus, setCourseStatus] = useState(status || "");
  const [isInProgress, setIsInProgress] = useState(status === "in-progress");
  const router = useRouter();
  
  // Update local state when props change
  useEffect(() => {
    setGrade(existingGrade || "");
    setHasGrade(!!existingGrade);
    setCourseStatus(status || "");
    setIsInProgress(status === "in-progress");
  }, [existingGrade, status]);

  const validateGrade = (gradeValue: string): boolean => {
    // Handle numeric grades
    const numericGrade = parseFloat(gradeValue);
    if (!isNaN(numericGrade)) {
      return numericGrade >= 0 && numericGrade <= 100;
    }
    
    // Handle letter grades (always valid since they're predefined)
    const validLetterGrades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];
    return validLetterGrades.includes(gradeValue.toUpperCase());
  };

  const handleSaveGrade = async () => {
    if (!grade.trim()) return;
    
    // Validate the grade before saving
    if (!validateGrade(grade)) {
      toast.error("Please enter a valid grade (0-100 for numeric grades)");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Use the server action to save the grade
      const result = await saveGradeAction(courseCode, grade, userId, requirementId);
      
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Grade saved successfully");
        setIsEditing(false);
        setHasGrade(true);
        // Update status to completed when grade is added
        setCourseStatus("completed");
        // Refresh the page data
        router.refresh();
      }
    } catch (error) {
      console.error("Error saving grade:", error);
      toast.error("Failed to save grade");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGrade = async () => {
    if (!confirm("Are you sure you want to delete this grade?")) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let result;
      
      if (!gradeId) {
        toast.error("Cannot delete grade: missing ID");
        setIsSubmitting(false);
        return;
      }
      
      console.log(`Attempting to delete grade with ID: ${gradeId}`);
      
      // Primary method: use deleteGradeAction with the grade ID
      const formData = new FormData();
      formData.append('grade_id', gradeId);
      
      result = await deleteGradeAction(formData);
      
      // If the primary method fails, try the force delete method
      if ('error' in result && result.error) {
        console.log("Primary delete method failed, trying force delete method:", result.error);
        
        // Force delete method
        const forceFormData = new FormData();
        forceFormData.append('grade_id', gradeId);
        result = await forceDeleteGradeAction(forceFormData);
        
        // If force delete also fails, try the saveGradeAction with empty string
        if ('error' in result && result.error) {
          console.log("Force delete method failed, trying empty grade method:", result.error);
          
          // Final fallback: use saveGradeAction with empty string to clear the grade
          result = await saveGradeAction(courseCode, "", userId);
        }
      }
      
      if ('error' in result && result.error) {
        toast.error(result.error);
      } else {
        // Update local state immediately
        setGrade("");
        setHasGrade(false);
        setCourseStatus("");
        
        toast.success("Grade deleted successfully");
        
        // Force a complete refresh to ensure data is reloaded from the server
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (error) {
      console.error("Error deleting grade:", error);
      toast.error("Failed to delete grade");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleInProgress = async () => {
    setIsSubmitting(true);
    try {
      const result = await toggleCourseStatusAction(courseCode, userId, requirementId);
      
      if ('error' in result && result.error) {
        toast.error(result.error);
      } else {
        const newStatus = !isInProgress ? "in-progress" : "";
        setIsInProgress(!isInProgress);
        setCourseStatus(newStatus);
        router.refresh();
      }
    } catch (error) {
      toast.error("Failed to update course status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = () => {
    // First priority: Check status field from database
    if (courseStatus === "in-progress") return "border-blue-400 bg-blue-50/80 dark:border-blue-500 dark:bg-blue-900/30";
    
    // Helper function to convert letter grades to numeric values
    const getNumericValue = (grade: string) => {
      const letterGrades: { [key: string]: number } = {
        'A+': 90, 'A': 85, 'A-': 80,
        'B+': 77, 'B': 73, 'B-': 70,
        'C+': 67, 'C': 63, 'C-': 60,
        'D+': 57, 'D': 53, 'D-': 50,
        'F': 0
      };
      return letterGrades[grade.toUpperCase()] || 0;
    };
    
    // Helper function to check if a grade meets requirements
    const isPassingGrade = (gradeValue: string): boolean => {
      if (!gradeValue) return false;
      
      const numericGrade = parseFloat(gradeValue);
      const gradeNumericValue = isNaN(numericGrade) ? getNumericValue(gradeValue) : numericGrade;
      
      // If there's a minimum grade requirement, use that
      if (minGrade) {
        const minGradeValue = isNaN(parseFloat(minGrade)) ? getNumericValue(minGrade) : parseFloat(minGrade);
        return gradeNumericValue >= minGradeValue;
      }
      
      // Otherwise use 50 as the passing threshold
      return gradeNumericValue >= 50;
    };
    
    // If no grade exists and no specific status, use default styling
    if (!existingGrade && !courseStatus) return "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800";
    
    // If there's a grade (regardless if status is "completed" or not specified)
    if (existingGrade) {
      return isPassingGrade(existingGrade) 
        ? "border-green-400 bg-green-50/80 dark:border-green-600 dark:bg-green-900/30" 
        : "border-red-400 bg-red-50/80 dark:border-red-600 dark:bg-red-900/30";
    }
    
    // Default color if none of the above conditions are met
    return "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800";
  };

  return (
    <div className={`rounded-lg shadow-sm p-4 border ${getStatusColor()} transition-all hover:shadow-md group`}>
      <div className="flex flex-col h-full min-h-[120px]">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-1 mb-1">
              <h3 className="font-bold text-gray-800 dark:text-gray-100">{courseCode}</h3>
              {!isInProgress && !hasGrade && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleInProgress}
                  disabled={isSubmitting}
                  className="h-5 w-5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/50 p-0.5 rounded-full opacity-80 hover:opacity-100"
                  title="Add to Progress"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              )}
              {isInProgress && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleInProgress}
                  disabled={isSubmitting}
                  className="h-5 w-5 text-red-600 hover:text-red-800 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/50 p-0.5 rounded-full opacity-80 hover:opacity-100"
                  title="Remove from Progress"
                >
                  <Minus className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-300">
              <span className="font-medium">{creditWeight} credit{creditWeight !== 1 ? 's' : ''}</span>
              {minGrade && (
                <span className="ml-1">
                  • Min: <span className="font-medium">{minGrade}</span>
                </span>
              )}
              
              {requirementType && (
                <div className="mt-1">
                  <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 font-medium">
                    {requirementType}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Show grade value in top right */}
          {hasGrade && existingGrade && !isEditing && (
            <div className="text-lg font-bold px-2 py-1 rounded-md bg-white/80 dark:bg-gray-700/80 shadow-sm border border-gray-100 dark:border-gray-600 dark:text-gray-100">
              {existingGrade}
            </div>
          )}
        </div>

        {/* Grade editing and buttons at bottom */}
        <div className="flex justify-end mt-auto pt-3">
          {isEditing ? (
            <div className="flex flex-col items-end gap-2 w-full">
              <Input
                type="text"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="Enter grade"
                className="w-full sm:w-32 text-center focus:ring-2 focus:ring-blue-400 h-8 text-sm dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                style={{ textAlign: 'center' }}
                autoFocus
              />
              <div className="flex gap-1">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  disabled={isSubmitting}
                  className="border-gray-300 dark:border-gray-600 h-7 text-xs dark:text-gray-200 dark:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button 
                  size="sm"
                  onClick={handleSaveGrade}
                  disabled={isSubmitting}
                  className="h-7 text-xs"
                >
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-1">
              {hasGrade && existingGrade ? (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="px-3 opacity-70 group-hover:opacity-100 transition-opacity border-gray-300 dark:border-gray-600 h-7 text-xs dark:text-gray-200 dark:bg-gray-800"
                  >
                    Edit
                  </Button>
                  {gradeId && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-red-600 hover:text-red-800 hover:bg-red-50 border-red-200 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/50 dark:border-red-800 px-3 opacity-70 group-hover:opacity-100 transition-opacity h-7 text-xs"
                      onClick={handleDeleteGrade}
                      disabled={isSubmitting}
                    >
                      Delete
                    </Button>
                  )}
                </>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="px-3 border-gray-300 dark:border-gray-600 h-7 text-xs dark:text-gray-200 dark:bg-gray-800"
                >
                  Add Grade
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 