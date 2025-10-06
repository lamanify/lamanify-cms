import { memo } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
  variant?: 'default' | 'primary' | 'muted';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

const variantClasses = {
  default: 'text-foreground',
  primary: 'text-primary',
  muted: 'text-muted-foreground',
};

export const LoadingSpinner = memo(({ 
  size = 'md', 
  className, 
  text,
  variant = 'primary'
}: LoadingSpinnerProps) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <Loader2 
        className={cn(
          'animate-spin',
          sizeClasses[size],
          variantClasses[variant],
          className
        )} 
      />
      {text && (
        <p className={cn(
          'text-sm',
          variantClasses[variant],
          'animate-pulse'
        )}>
          {text}
        </p>
      )}
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

// Skeleton loading component for cards
export const SkeletonCard = memo(() => (
  <div className="animate-pulse space-y-4 p-6 bg-white rounded-lg border">
    <div className="flex items-center space-x-4">
      <div className="rounded-full bg-gray-200 h-10 w-10"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
    <div className="grid grid-cols-3 gap-4">
      <div className="h-20 bg-gray-200 rounded"></div>
      <div className="h-20 bg-gray-200 rounded"></div>
      <div className="h-20 bg-gray-200 rounded"></div>
    </div>
  </div>
));

SkeletonCard.displayName = 'SkeletonCard';

// Skeleton loading for table rows
export const SkeletonTableRow = memo(() => (
  <tr className="animate-pulse">
    <td className="px-6 py-4">
      <div className="h-4 bg-gray-200 rounded w-24"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-4 bg-gray-200 rounded w-32"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-4 bg-gray-200 rounded w-16"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-6 bg-gray-200 rounded w-20"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-8 bg-gray-200 rounded w-24"></div>
    </td>
  </tr>
));

SkeletonTableRow.displayName = 'SkeletonTableRow';

// Fast inline loader for status changes
export const InlineLoader = memo(({ className }: { className?: string }) => (
  <Loader2 className={cn('h-3 w-3 animate-spin text-primary', className)} />
));

InlineLoader.displayName = 'InlineLoader';