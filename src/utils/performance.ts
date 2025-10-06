// Performance utilities for LamaniHub

// Memory cache with TTL (Time To Live)
class MemoryCache {
  private cache = new Map<string, { data: any; expires: number }>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any, ttl = this.defaultTTL) {
    const expires = Date.now() + ttl;
    this.cache.set(key, { data, expires });
    
    // Auto-cleanup expired entries
    setTimeout(() => {
      if (this.cache.has(key)) {
        const entry = this.cache.get(key);
        if (entry && entry.expires <= Date.now()) {
          this.cache.delete(key);
        }
      }
    }, ttl);
  }

  get(key: string) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (entry.expires <= Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (entry.expires <= Date.now()) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

// Global cache instances
export const userCache = new MemoryCache();
export const dataCache = new MemoryCache();
export const queryCache = new MemoryCache();

// Debounce function for search inputs
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
}

// Throttle function for scroll events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Optimistic update helper
export function createOptimisticUpdate<T>(
  currentData: T[],
  update: Partial<T> & { id: string },
  operation: 'create' | 'update' | 'delete'
): T[] {
  switch (operation) {
    case 'create':
      return [update as T, ...currentData];
    
    case 'update':
      return currentData.map(item => 
        (item as any).id === update.id 
          ? { ...item, ...update }
          : item
      );
    
    case 'delete':
      return currentData.filter(item => (item as any).id !== update.id);
    
    default:
      return currentData;
  }
}

// Local storage with expiry
export const localStorageWithExpiry = {
  set(key: string, value: any, ttl = 24 * 60 * 60 * 1000) { // 24 hours default
    const now = new Date();
    const item = {
      value,
      expiry: now.getTime() + ttl
    };
    try {
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.warn('LocalStorage quota exceeded:', error);
    }
  },

  get(key: string) {
    try {
      const itemStr = localStorage.getItem(key);
      if (!itemStr) return null;
      
      const item = JSON.parse(itemStr);
      const now = new Date();
      
      if (now.getTime() > item.expiry) {
        localStorage.removeItem(key);
        return null;
      }
      
      return item.value;
    } catch (error) {
      console.warn('Error reading from localStorage:', error);
      return null;
    }
  },

  remove(key: string) {
    localStorage.removeItem(key);
  },

  clear() {
    localStorage.clear();
  }
};

// Performance monitoring
export const performance = {
  mark(name: string) {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(name);
    }
  },

  measure(name: string, startMark: string, endMark?: string) {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.measure(name, startMark, endMark);
    }
  },

  getEntriesByName(name: string) {
    if (typeof window !== 'undefined' && window.performance) {
      return window.performance.getEntriesByName(name);
    }
    return [];
  },

  clearMarks(name?: string) {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.clearMarks(name);
    }
  }
};

// Cache key generators
export const cacheKeys = {
  user: (userId: string) => `user:${userId}`,
  profile: (userId: string) => `profile:${userId}`,
  tenant: (tenantId: string) => `tenant:${tenantId}`,
  leads: (tenantId: string, filters?: string) => 
    `leads:${tenantId}${filters ? `:${filters}` : ''}`,
  patients: (tenantId: string, page?: number) => 
    `patients:${tenantId}${page ? `:page:${page}` : ''}`,
  appointments: (tenantId: string, date?: string) => 
    `appointments:${tenantId}${date ? `:${date}` : ''}`,
};

// Preload critical resources
export function preloadCriticalResources() {
  // Preload critical images
  const criticalImages = [
    '/logo.png',
    '/favicon.ico'
  ];
  
  criticalImages.forEach(src => {
    const img = new Image();
    img.src = src;
  });
  
  // Preload critical fonts
  if (typeof document !== 'undefined') {
    const fontLinks = document.querySelectorAll('link[rel="preload"][as="font"]');
    fontLinks.forEach(link => {
      const font = new FontFace(
        (link as HTMLLinkElement).href.split('/').pop()?.split('.')[0] || 'font',
        `url(${(link as HTMLLinkElement).href})`
      );
      font.load();
    });
  }
}

// Clear all caches (useful for sign out)
export function clearAllCaches() {
  userCache.clear();
  dataCache.clear();
  queryCache.clear();
  
  // Clear localStorage with prefix
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('lamanihub:') || key.startsWith('sb-'))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
}

// Detect slow connections
export function isSlowConnection(): boolean {
  if (typeof navigator !== 'undefined' && 'connection' in navigator) {
    const connection = (navigator as any).connection;
    return connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g');
  }
  return false;
}

// Optimize images for slow connections
export function getOptimizedImageUrl(url: string, quality = 85): string {
  if (isSlowConnection()) {
    // Return lower quality version for slow connections
    return url.replace(/\.(jpg|jpeg|png)$/i, `-q${Math.max(50, quality - 20)}.$1`);
  }
  return url;
}