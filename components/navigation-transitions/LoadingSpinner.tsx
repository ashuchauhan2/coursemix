'use client';

export default function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-teal-600 dark:border-teal-500 border-t-transparent"></div>
    </div>
  );
} 