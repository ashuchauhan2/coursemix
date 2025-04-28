"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  markWorkTermCompletedAction, 
  updateWorkTermCompanyAction,
  deleteWorkTermAction,
  toggleWorkTermCompletedAction
} from "@/app/academic-progress-actions";
import { useRouter } from "next/navigation";
import { Edit, Check, X, Trash2 } from "lucide-react";

interface WorkTermCardProps {
  termName: string;
  userId: string;
  workTermId?: string;
  status?: string;
  companyName?: string;
  isScieWorkshop?: boolean;
}

export default function WorkTermCard({
  termName,
  userId,
  workTermId,
  status,
  companyName,
  isScieWorkshop = false,
}: WorkTermCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isCompleted, setIsCompleted] = useState(status === "completed");
  const [company, setCompany] = useState(companyName || "");
  const router = useRouter();
  
  // Update local state when props change
  useEffect(() => {
    setIsCompleted(status === "completed");
    setCompany(companyName || "");
  }, [status, companyName]);

  const handleToggleCompleted = async () => {
    setIsSubmitting(true);
    try {
      const result = await toggleWorkTermCompletedAction(termName, userId, workTermId);
      
      if ('error' in result && result.error) {
        toast.error(result.error);
      } else {
        setIsCompleted(!isCompleted);
        toast.success(isCompleted ? "Work term status updated" : "Work term marked as completed");
        router.refresh();
      }
    } catch (error) {
      toast.error("Failed to update work term status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCompany = async () => {
    if (!company.trim()) {
      toast.error("Company name cannot be empty");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const result = await updateWorkTermCompanyAction(termName, userId, company, workTermId);
      
      if ('error' in result && result.error) {
        toast.error(result.error);
      } else {
        setIsEditing(false);
        toast.success("Company name updated");
        router.refresh();
      }
    } catch (error) {
      toast.error("Failed to update company name");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWorkTerm = async () => {
    if (!workTermId) {
      toast.error("Cannot delete: Work term ID not found");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await deleteWorkTermAction(workTermId, userId);
      
      if ('error' in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success("Work term removed");
        router.refresh();
      }
    } catch (error) {
      toast.error("Failed to remove work term");
    } finally {
      setIsSubmitting(false);
      setIsConfirmingDelete(false);
    }
  };

  const getStatusColor = () => {
    if (isCompleted) return "border-green-400 bg-green-50/80 dark:border-green-600 dark:bg-green-900/30";
    return "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800";
  };

  return (
    <div className={`rounded-lg shadow-sm p-4 border ${getStatusColor()} transition-all hover:shadow-md group`}>
      <div className="flex flex-col h-full min-h-[120px]">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-1 mb-1">
              <h3 className="font-bold text-gray-800 dark:text-gray-100">{termName}</h3>
            </div>
            
            {!isScieWorkshop && (
              <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    <Input
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Company name"
                      className="h-7 text-xs w-32 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleUpdateCompany}
                      disabled={isSubmitting}
                      className="h-5 w-5 text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/50 p-0.5 rounded-full"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setIsEditing(false);
                        setCompany(companyName || "");
                      }}
                      className="h-5 w-5 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50 p-0.5 rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span>{company || "No company specified"}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsEditing(true)}
                      className="h-5 w-5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 p-0.5 rounded-full opacity-80 hover:opacity-100"
                      title="Edit Company"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {!isConfirmingDelete ? (
              <>
                <Button
                  variant={isCompleted ? "outline" : "outline"}
                  size="sm"
                  disabled={isSubmitting}
                  onClick={handleToggleCompleted}
                  className={`text-xs h-7 ${isCompleted 
                    ? "bg-green-50 border-green-500 text-green-600 hover:bg-white hover:text-green-700 dark:bg-green-900/30 dark:border-green-600 dark:text-green-400 dark:hover:bg-green-900/50 dark:hover:text-green-300" 
                    : "bg-white hover:bg-green-50 border-green-500 text-green-600 hover:text-green-700 dark:bg-gray-800 dark:hover:bg-green-900/30 dark:border-green-700 dark:text-green-400 dark:hover:text-green-300"}`}
                >
                  {isCompleted ? "Undo Complete" : "Mark Complete"}
                </Button>
                
                {workTermId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsConfirmingDelete(true)}
                    className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30"
                    title="Remove Work Term"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsConfirmingDelete(false)}
                  className="text-xs h-7 bg-white hover:bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={handleDeleteWorkTerm}
                  className="text-xs h-7 bg-white hover:bg-red-50 border-red-500 text-red-600 hover:text-red-700 dark:bg-gray-800 dark:hover:bg-red-900/30 dark:border-red-600 dark:text-red-400 dark:hover:text-red-300"
                >
                  Confirm Delete
                </Button>
              </>
            )}
          </div>
        </div>
        
        <div className="mt-auto pt-2">
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {isScieWorkshop ? (
              "Required co-op preparation"
            ) : (
              "Co-op work term"
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 