import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type DashboardTab = 'Registration' | 'Appointment' | 'Consultation' | 'Reviews' | 'Insight';

export interface UserPermissions {
  view_clinic_management: boolean;
  view_sales_report: boolean;
  manage_users: boolean;
  cancel_visit: boolean;
}

export const defaultDashboardAccess = {
  admin: ['Registration', 'Appointment', 'Consultation', 'Reviews', 'Insight'] as DashboardTab[],
  doctor: ['Appointment', 'Consultation'] as DashboardTab[],
  nurse: ['Registration', 'Appointment'] as DashboardTab[],
  receptionist: ['Registration', 'Appointment', 'Reviews'] as DashboardTab[],
  locum: ['Appointment', 'Consultation'] as DashboardTab[]
};

export function useUserPermissions() {
  const { profile, user } = useAuth();
  const [permissions, setPermissions] = useState<UserPermissions>({
    view_clinic_management: false,
    view_sales_report: false,
    manage_users: false,
    cancel_visit: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && profile) {
      fetchUserPermissions();
    } else {
      setLoading(false);
    }
  }, [user, profile]);

  const fetchUserPermissions = async () => {
    if (!user || !profile) return;

    try {
      setLoading(true);
      
      // Fetch user-specific permissions
      const { data: userPermissions, error } = await supabase
        .from('user_permissions')
        .select('permission_type, permission_value')
        .eq('user_id', user.id);

      if (error) throw error;

      // Set default permissions based on role
      const roleDefaults = {
        view_clinic_management: profile.role === 'admin',
        view_sales_report: profile.role === 'admin',
        manage_users: profile.role === 'admin',
        cancel_visit: ['admin', 'doctor', 'nurse', 'receptionist'].includes(profile.role)
      };

      // Override with user-specific permissions
      const finalPermissions = { ...roleDefaults };
      userPermissions?.forEach(perm => {
        if (perm.permission_type in finalPermissions) {
          (finalPermissions as any)[perm.permission_type] = perm.permission_value;
        }
      });

      setPermissions(finalPermissions);
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      // Fallback to role-based defaults
      if (profile) {
        setPermissions({
          view_clinic_management: profile.role === 'admin',
          view_sales_report: profile.role === 'admin',
          manage_users: profile.role === 'admin',
          cancel_visit: ['admin', 'doctor', 'nurse', 'receptionist'].includes(profile.role)
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Get accessible dashboard tabs based on role
  const getAccessibleTabs = (): DashboardTab[] => {
    if (!profile) return [];
    
    const roleAccess = defaultDashboardAccess[profile.role as keyof typeof defaultDashboardAccess];
    return roleAccess || [];
  };

  // Check if user has access to a specific dashboard tab
  const hasTabAccess = (tab: DashboardTab): boolean => {
    return getAccessibleTabs().includes(tab);
  };

  // Check if user has a specific permission
  const hasPermission = (permissionType: keyof UserPermissions): boolean => {
    return permissions[permissionType];
  };

  // Check if user can access clinic management (settings)
  const canAccessClinicManagement = (): boolean => {
    return profile?.role === 'admin' && permissions.view_clinic_management;
  };

  // Check if user can manage other users
  const canManageUsers = (): boolean => {
    return profile?.role === 'admin' && permissions.manage_users;
  };

  // Check if user can view sales reports
  const canViewSalesReport = (): boolean => {
    return profile?.role === 'admin' && permissions.view_sales_report;
  };

  // Check if user can cancel visits/registrations
  const canCancelVisit = (): boolean => {
    return permissions.cancel_visit;
  };

  return {
    permissions,
    loading,
    profile,
    getAccessibleTabs,
    hasTabAccess,
    hasPermission,
    canAccessClinicManagement,
    canManageUsers,
    canViewSalesReport,
    canCancelVisit,
    refetch: fetchUserPermissions
  };
}