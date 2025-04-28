import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { XCircle, CheckCircle } from 'lucide-react';

interface MessageProps {
  type?: 'error' | 'success' | 'info';
  message?: string;
  duration?: number; // Duration in ms before auto-dismissing, 0 means no auto-dismiss
  className?: string;
  onDismiss?: () => void;
}

export const Message = ({
  type = 'info',
  message,
  duration = 0,
  className = '',
  onDismiss
}: MessageProps) => {
  const [visible, setVisible] = useState(!!message);
  
  useEffect(() => {
    setVisible(!!message);
    
    // Auto-dismiss after duration if specified
    if (message && duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onDismiss) onDismiss();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [message, duration, onDismiss]);
  
  if (!visible || !message) return null;
  
  const getStyles = () => {
    switch (type) {
      case 'error':
        return 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'success':
        return 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
      case 'info':
      default:
        return 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    }
  };
  
  const getIcon = () => {
    switch (type) {
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500 dark:text-red-400" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />;
      default:
        return null;
    }
  };
  
  const handleDismiss = () => {
    setVisible(false);
    if (onDismiss) onDismiss();
  };
  
  return (
    <div 
      className={`p-4 mb-4 rounded-md border flex items-start justify-between ${getStyles()} ${className}`}
      role={type === 'error' ? 'alert' : 'status'}
    >
      <div className="flex items-center">
        {getIcon()}
        <div className={getIcon() ? 'ml-3' : ''}>{message}</div>
      </div>
      <button
        type="button"
        className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 ml-auto"
        onClick={handleDismiss}
        aria-label="Dismiss"
      >
        <XCircle className="w-5 h-5" />
      </button>
    </div>
  );
};

/**
 * A component that processes search params and renders a message
 */
function SearchParamsProcessor() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'error' | 'success' | 'info'>('info');
  
  useEffect(() => {
    const error = searchParams.get('error');
    const success = searchParams.get('success');
    const info = searchParams.get('info');
    
    if (error) {
      setMessage(error);
      setMessageType('error');
    } else if (success) {
      setMessage(success);
      setMessageType('success');
    } else if (info) {
      setMessage(info);
      setMessageType('info');
    } else {
      setMessage(null);
    }
  }, [searchParams]);
  
  return message ? (
    <Message
      type={messageType}
      message={message}
      duration={10000} // Auto-dismiss after 10 seconds
    />
  ) : null;
}

/**
 * A component that automatically displays messages from URL search params
 * Wrapped in Suspense for Next.js 15 compatibility
 */
export const SearchParamsMessage = () => {
  return (
    <Suspense fallback={<div className="w-full h-6"></div>}>
      <SearchParamsProcessor />
    </Suspense>
  );
}; 