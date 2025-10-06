import { useEffect } from 'react';
import { disableCaching } from '@/utils/cacheUtils';

interface NoCacheWrapperProps {
  children: React.ReactNode;
}

export default function NoCacheWrapper({ children }: NoCacheWrapperProps) {
  useEffect(() => {
    disableCaching();

    // Handle page show events (back button)
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        disableCaching();
        window.location.reload();
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  return <>{children}</>;
}