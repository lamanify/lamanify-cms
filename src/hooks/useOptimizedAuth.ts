import { useEffect, useState, useCallback, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  tenant_id?: string;
  status: string;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
}

// Memory cache for profile data
let profileCache: { [key: string]: Profile } = {};
let authStateCache: AuthState | null = null;

export function useOptimizedAuth() {
  const { toast } = useToast();
  const [authState, setAuthState] = useState<AuthState>(() => {
    // Return cached state immediately if available
    return authStateCache || {
      user: null,
      profile: null,
      loading: true,
      initialized: false
    };
  });

  // Memoized update function to prevent unnecessary re-renders
  const updateAuthState = useCallback((updates: Partial<AuthState>) => {
    setAuthState(current => {
      const newState = { ...current, ...updates };
      authStateCache = newState; // Cache for immediate future use
      return newState;
    });
  }, []);

  // Optimized profile fetcher with caching
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    // Return cached profile immediately if available
    if (profileCache[userId]) {
      return profileCache[userId];
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Profile fetch error:', error);
        return null;
      }

      // Cache the profile for future use
      if (data) {
        profileCache[userId] = data;
      }

      return data;
    } catch (error) {
      console.error('Profile fetch exception:', error);
      return null;
    }
  }, []);

  // Fast sign out with immediate UI update
  const signOut = useCallback(async () => {
    // Immediately update UI (optimistic update)
    updateAuthState({
      user: null,
      profile: null,
      loading: false,
      initialized: true
    });

    // Clear all caches
    profileCache = {};
    authStateCache = null;

    try {
      // Sign out in background
      await supabase.auth.signOut();
      
      // Clear any remaining Supabase cache
      localStorage.removeItem('sb-' + supabase.supabaseUrl.split('//')[1].split('.')[0] + '-auth-token');
      
      toast({
        title: "Signed out successfully",
        description: "See you next time!",
      });
    } catch (error) {
      console.error('Sign out error:', error);
      // Don't revert UI state - user expects to be signed out
    }
  }, [updateAuthState, toast]);

  // Optimized sign in with immediate loading states
  const signIn = useCallback(async (email: string, password: string) => {
    updateAuthState({ loading: true });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        updateAuthState({ loading: false });
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      if (data.user) {
        // Optimistically show user immediately
        updateAuthState({ 
          user: data.user, 
          loading: true // Keep loading for profile
        });

        // Fetch profile in background
        const profile = await fetchProfile(data.user.id);
        updateAuthState({ 
          profile, 
          loading: false, 
          initialized: true 
        });
      }

      return true;
    } catch (error) {
      console.error('Sign in exception:', error);
      updateAuthState({ loading: false });
      toast({
        title: "Sign in error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [updateAuthState, fetchProfile, toast]);

  // Initialize auth state on mount
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Check for cached session first
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (error) {
          console.error('Session error:', error);
          updateAuthState({ 
            loading: false, 
            initialized: true 
          });
          return;
        }

        if (session?.user) {
          // Show user immediately
          updateAuthState({ 
            user: session.user,
            loading: true // Keep loading for profile
          });

          // Fetch profile in background
          const profile = await fetchProfile(session.user.id);
          if (mounted) {
            updateAuthState({ 
              profile, 
              loading: false, 
              initialized: true 
            });
          }
        } else {
          updateAuthState({ 
            loading: false, 
            initialized: true 
          });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          updateAuthState({ 
            loading: false, 
            initialized: true 
          });
        }
      }
    };

    // Initialize immediately
    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          updateAuthState({ 
            user: session.user,
            loading: true 
          });
          
          const profile = await fetchProfile(session.user.id);
          if (mounted) {
            updateAuthState({ 
              profile, 
              loading: false, 
              initialized: true 
            });
          }
        } else if (event === 'SIGNED_OUT') {
          // Clear caches on sign out
          profileCache = {};
          authStateCache = null;
          
          updateAuthState({
            user: null,
            profile: null,
            loading: false,
            initialized: true
          });
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [updateAuthState, fetchProfile]);

  // Memoize return values to prevent unnecessary re-renders
  const returnValue = useMemo(() => ({
    ...authState,
    signIn,
    signOut,
    // Helper computed values
    isAuthenticated: !!authState.user,
    isLoading: authState.loading,
    isReady: authState.initialized
  }), [authState, signIn, signOut]);

  return returnValue;
}