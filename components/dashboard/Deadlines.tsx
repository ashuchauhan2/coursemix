'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { PlusCircle, Trash2, Calendar } from 'lucide-react';

interface Deadline {
  id: string;
  user_id: string;
  title: string;
  due_date: string;
  created_at: string;
}

interface DeadlinesProps {
  userId: string;
}

export default function Deadlines({ userId }: DeadlinesProps) {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add a state for visible deadlines based on container height
  const [visibleDeadlines, setVisibleDeadlines] = useState<Deadline[]>([]);
  const deadlinesContainerRef = useRef<HTMLDivElement>(null);

  const fetchDeadlines = async () => {
    setIsLoading(true);
    setError(null);
    
    const supabase = createClient();
    
    // Get today's date in ISO format (YYYY-MM-DD)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISOString = today.toISOString().split('T')[0];
    
    try {
      const { data, error } = await supabase
        .from('deadlines')
        .select('*')
        .eq('user_id', userId)
        .gte('due_date', todayISOString) // Only get deadlines today or in the future
        .order('due_date', { ascending: true }); // Sort by nearest date first
      
      if (error) throw error;
      
      setDeadlines(data || []);
    } catch (err) {
      console.error('Error fetching deadlines:', err);
      setError('Failed to load deadlines');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchDeadlines();
    }
  }, [userId]);

  // Update visible deadlines when deadlines change or on resize
  useEffect(() => {
    const updateVisibleDeadlines = () => {
      if (!deadlinesContainerRef.current || deadlines.length === 0) {
        setVisibleDeadlines(deadlines);
        return;
      }
      
      // Approximate height calculation based on container size
      // Each deadline item is roughly 60-70px tall depending on content
      const containerHeight = deadlinesContainerRef.current.clientHeight;
      const itemHeight = 70; // Average height of a deadline item
      const maxItems = Math.max(3, Math.floor(containerHeight / itemHeight));
      
      // Set visible deadlines (at least 3, but potentially more based on space)
      setVisibleDeadlines(deadlines.slice(0, maxItems));
    };
    
    updateVisibleDeadlines();
    
    // Add resize listener to update on window resize
    window.addEventListener('resize', updateVisibleDeadlines);
    return () => window.removeEventListener('resize', updateVisibleDeadlines);
  }, [deadlines]);

  const handleAddDeadline = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTitle.trim() || !newDueDate) {
      setError('Please enter both a title and due date');
      return;
    }
    
    // Validate that the due date is not in the past
    const selectedDate = new Date(newDueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      setError('Due date cannot be in the past');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    const supabase = createClient();
    
    try {
      const { error } = await supabase
        .from('deadlines')
        .insert([
          { 
            title: newTitle.trim(),
            due_date: newDueDate,
            user_id: userId
          }
        ]);
      
      if (error) throw error;
      
      setNewTitle('');
      setNewDueDate('');
      fetchDeadlines();
      setIsOpen(false);
    } catch (err) {
      console.error('Error adding deadline:', err);
      setError('Failed to add deadline');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDeadline = async (id: string) => {
    setIsSubmitting(true);
    
    const supabase = createClient();
    
    try {
      const { error } = await supabase
        .from('deadlines')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setDeadlines(deadlines.filter(d => d.id !== id));
    } catch (err) {
      console.error('Error deleting deadline:', err);
      setError('Failed to delete deadline');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // Calculate days until deadline
  const getDaysUntil = (dateString: string): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueDate = new Date(dateString);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `In ${diffDays} days`;
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-1 sm:mb-2">
        <h3 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
          Upcoming Deadlines
        </h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center"
          aria-label="Add deadline"
        >
          <PlusCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
          <span className="hidden sm:inline">Add</span>
        </button>
      </div>

      {error && (
        <div className="text-xs text-red-600 dark:text-red-400 mb-2">
          {error}
        </div>
      )}

      {isOpen && (
        <form onSubmit={handleAddDeadline} className="mb-3 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
          <div className="mb-2">
            <label htmlFor="title" className="block text-xs text-gray-600 dark:text-gray-300 mb-1">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full text-xs p-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md text-gray-800 dark:text-gray-200"
              placeholder="Assignment, exam, etc."
              required
            />
          </div>
          <div className="mb-2">
            <label htmlFor="dueDate" className="block text-xs text-gray-600 dark:text-gray-300 mb-1">
              Due Date
            </label>
            <input
              type="date"
              id="dueDate"
              value={newDueDate}
              min={new Date().toISOString().split('T')[0]} // Set min to today
              onChange={(e) => setNewDueDate(e.target.value)}
              className="w-full text-xs p-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md text-gray-800 dark:text-gray-200"
              required
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add Deadline'}
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs px-3 py-1.5 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 rounded-md"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div 
        ref={deadlinesContainerRef} 
        className="bg-gray-50 dark:bg-gray-700 rounded-md p-2 sm:p-3 divide-y divide-gray-200 dark:divide-gray-600 flex-grow overflow-y-auto min-h-[200px]"
      >
        {isLoading ? (
          <div className="py-2 text-center text-xs text-gray-500 dark:text-gray-400">
            Loading deadlines...
          </div>
        ) : visibleDeadlines.length === 0 ? (
          <div className="py-2 text-center text-xs text-gray-500 dark:text-gray-400">
            No upcoming deadlines
          </div>
        ) : (
          visibleDeadlines.map((deadline) => (
            <div key={deadline.id} className="py-2 first:pt-0 last:pb-0">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {deadline.title}
                  </span>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    <Calendar className="w-3 h-3 mr-1" />
                    <span>{formatDate(deadline.due_date)}</span>
                    <span className="ml-1.5 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-600 rounded text-xs">
                      {getDaysUntil(deadline.due_date)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteDeadline(deadline.id)}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  aria-label="Delete deadline"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
      {deadlines.length > visibleDeadlines.length && (
        <div className="text-center mt-2 text-xs text-indigo-600 dark:text-indigo-400">
          +{deadlines.length - visibleDeadlines.length} more deadlines
        </div>
      )}
    </div>
  );
} 