import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { dataCache, cacheKeys, createOptimisticUpdate } from '@/utils/performance';
import { useToast } from '@/hooks/use-toast';

// Generic optimized data fetcher
export function useOptimizedQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options: {
    enabled?: boolean;
    staleTime?: number;
    gcTime?: number;
    retry?: number;
    refetchOnWindowFocus?: boolean;
  } = {}
) {
  const cacheKey = queryKey.join(':');
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      // Check memory cache first for instant results
      const cached = dataCache.get(cacheKey);
      if (cached) {
        // Return cached data immediately, but still fetch in background
        setTimeout(async () => {
          try {
            const fresh = await queryFn();
            dataCache.set(cacheKey, fresh);
          } catch (error) {
            console.warn('Background refresh failed:', error);
          }
        }, 0);
        return cached;
      }
      
      // Fetch fresh data
      const data = await queryFn();
      dataCache.set(cacheKey, data);
      return data;
    },
    staleTime: options.staleTime ?? 2 * 60 * 1000, // 2 minutes
    gcTime: options.gcTime ?? 5 * 60 * 1000, // 5 minutes
    retry: options.retry ?? 1,
    refetchOnWindowFocus: options.refetchOnWindowFocus ?? false,
    enabled: options.enabled ?? true,
  });
}

// Optimized leads data hook
export function useOptimizedLeads() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryKey = useMemo(() => {
    return profile?.tenant_id ? ['leads', profile.tenant_id] : ['leads'];
  }, [profile?.tenant_id]);

  const { data: leads, isLoading, error, refetch } = useOptimizedQuery(
    queryKey,
    async () => {
      if (!profile?.tenant_id) return [];
      
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    {
      enabled: !!profile?.tenant_id,
      staleTime: 1 * 60 * 1000, // 1 minute for leads (more dynamic)
    }
  );

  // Optimistic update mutation
  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousLeads = queryClient.getQueryData(queryKey);

      // Optimistically update
      queryClient.setQueryData(queryKey, (old: any[]) => {
        if (!old) return [];
        return createOptimisticUpdate(old, { id, ...updates }, 'update');
      });

      return { previousLeads };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousLeads) {
        queryClient.setQueryData(queryKey, context.previousLeads);
      }
      toast({
        title: "Update failed",
        description: "Failed to update lead. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: "Updated successfully",
        description: "Lead status has been updated.",
      });
    },
  });

  const updateLeadStatus = useCallback(
    (leadId: string, status: string) => {
      updateLeadMutation.mutate({ id: leadId, updates: { status } });
    },
    [updateLeadMutation]
  );

  return {
    leads: leads || [],
    isLoading,
    error,
    refetch,
    updateLeadStatus,
    isUpdating: updateLeadMutation.isPending,
  };
}

// Optimized patients data hook
export function useOptimizedPatients(page = 1, searchTerm = '') {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = useMemo(() => {
    return profile?.tenant_id 
      ? ['patients', profile.tenant_id, page.toString(), searchTerm]
      : ['patients'];
  }, [profile?.tenant_id, page, searchTerm]);

  const { data, isLoading, error } = useOptimizedQuery(
    queryKey,
    async () => {
      if (!profile?.tenant_id) return { patients: [], count: 0 };
      
      let query = supabase
        .from('patients')
        .select('*', { count: 'exact' })
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })
        .range((page - 1) * 50, page * 50 - 1); // 50 per page

      if (searchTerm) {
        query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }

      const { data: patients, error, count } = await query;

      if (error) throw error;
      return { patients: patients || [], count: count || 0 };
    },
    {
      enabled: !!profile?.tenant_id,
      staleTime: 3 * 60 * 1000, // 3 minutes for patients (less dynamic)
    }
  );

  return {
    patients: data?.patients || [],
    totalCount: data?.count || 0,
    isLoading,
    error,
    hasNextPage: (data?.count || 0) > page * 50,
    hasPreviousPage: page > 1,
  };
}

// Optimized appointments data hook
export function useOptimizedAppointments(date?: string) {
  const { profile } = useAuth();

  const queryKey = useMemo(() => {
    return profile?.tenant_id 
      ? ['appointments', profile.tenant_id, date || 'all']
      : ['appointments'];
  }, [profile?.tenant_id, date]);

  const { data: appointments, isLoading, error } = useOptimizedQuery(
    queryKey,
    async () => {
      if (!profile?.tenant_id) return [];
      
      let query = supabase
        .from('appointments')
        .select(`
          *,
          patients (first_name, last_name, phone, email)
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('appointment_date', { ascending: true });

      if (date) {
        query = query.gte('appointment_date', date)
                    .lt('appointment_date', new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000).toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    {
      enabled: !!profile?.tenant_id,
      staleTime: 30 * 1000, // 30 seconds for appointments (very dynamic)
    }
  );

  return {
    appointments: appointments || [],
    isLoading,
    error,
  };
}

// Cache invalidation helpers
export function useInvalidateQueries() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useCallback({
    invalidateLeads: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      if (profile?.tenant_id) {
        dataCache.delete(cacheKeys.leads(profile.tenant_id));
      }
    },
    invalidatePatients: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      if (profile?.tenant_id) {
        dataCache.delete(cacheKeys.patients(profile.tenant_id));
      }
    },
    invalidateAppointments: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      if (profile?.tenant_id) {
        dataCache.delete(cacheKeys.appointments(profile.tenant_id));
      }
    },
    invalidateAll: () => {
      queryClient.invalidateQueries();
      dataCache.clear();
    },
  }, [queryClient, profile?.tenant_id]);
}