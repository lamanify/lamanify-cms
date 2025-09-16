import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type UserRole = 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'locum';

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: string;
  last_login_at?: string;
  created_at: string;
  invitation_status?: string;
  permissions?: UserPermission[];
}

export interface UserPermission {
  permission_type: string;
  permission_value: boolean;
}

export interface CreateUserData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  password: string;
  role: UserRole;
  permissions?: { [key: string]: boolean };
}

export interface UpdateUserData {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  status?: string;
  permissions?: { [key: string]: boolean };
}

export const roleDescriptions = {
  admin: 'Full access to all settings and dashboards',
  doctor: 'Clinical staff can view and update patient health records and prescriptions, as well as book appointments.',
  nurse: 'Nursing staff with patient care responsibilities and appointment management',
  receptionist: 'Front desk operations and patient management',
  locum: 'Temporary doctor access with consultation privileges'
};

export const dashboardAccess = {
  admin: ['Registration', 'Appointment', 'Consultation', 'Reviews', 'Insight'],
  doctor: ['Appointment', 'Consultation'],
  nurse: ['Registration', 'Appointment'],
  receptionist: ['Registration', 'Appointment', 'Reviews'],
  locum: ['Appointment', 'Consultation']
};

export const defaultPermissions = {
  view_clinic_management: { admin: true, doctor: false, nurse: false, receptionist: false, locum: false },
  view_sales_report: { admin: true, doctor: false, nurse: false, receptionist: false, locum: false },
  manage_users: { admin: true, doctor: false, nurse: false, receptionist: false, locum: false },
  cancel_visit: { admin: true, doctor: true, nurse: true, receptionist: true, locum: false }
};

export function useUserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles with permissions
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_permissions(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to include permissions in a more usable format
      const usersWithPermissions = profiles?.map(profile => ({
        ...profile,
        permissions: profile.user_permissions || []
      })) || [];

      setUsers(usersWithPermissions);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch users"
      });
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: CreateUserData) => {
    try {
      // Create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.first_name,
            last_name: userData.last_name,
            role: userData.role
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Update the profile with additional information
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            first_name: userData.first_name,
            last_name: userData.last_name,
            email: userData.email,
            phone: userData.phone,
            role: userData.role
          })
          .eq('id', authData.user.id);

        if (profileError) throw profileError;

        // Set permissions if provided
        if (userData.permissions) {
          const permissionEntries = Object.entries(userData.permissions).map(([type, value]) => ({
            user_id: authData.user.id,
            permission_type: type,
            permission_value: value
          }));

          if (permissionEntries.length > 0) {
            const { error: permissionError } = await supabase
              .from('user_permissions')
              .insert(permissionEntries);

            if (permissionError) throw permissionError;
          }
        }

        await fetchUsers();
        toast({
          title: "Success",
          description: "User created successfully"
        });
        return true;
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create user"
      });
      return false;
    }
  };

  const updateUser = async (userId: string, userData: UpdateUserData) => {
    try {
      // Update profile
      const profileUpdate: any = {};
      if (userData.first_name) profileUpdate.first_name = userData.first_name;
      if (userData.last_name) profileUpdate.last_name = userData.last_name;
      if (userData.email) profileUpdate.email = userData.email;
      if (userData.phone !== undefined) profileUpdate.phone = userData.phone;
      if (userData.role) profileUpdate.role = userData.role;
      if (userData.status) profileUpdate.status = userData.status;

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', userId);

      if (profileError) throw profileError;

      // Update permissions if provided
      if (userData.permissions) {
        // Delete existing permissions
        await supabase
          .from('user_permissions')
          .delete()
          .eq('user_id', userId);

        // Insert new permissions
        const permissionEntries = Object.entries(userData.permissions).map(([type, value]) => ({
          user_id: userId,
          permission_type: type,
          permission_value: value
        }));

        if (permissionEntries.length > 0) {
          const { error: permissionError } = await supabase
            .from('user_permissions')
            .insert(permissionEntries);

          if (permissionError) throw permissionError;
        }
      }

      await fetchUsers();
      toast({
        title: "Success",
        description: "User updated successfully"
      });
      return true;
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update user"
      });
      return false;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      // Delete user permissions first
      await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', userId);

      // Update profile status to inactive instead of deleting
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'inactive' })
        .eq('id', userId);

      if (error) throw error;

      await fetchUsers();
      toast({
        title: "Success",
        description: "User deactivated successfully"
      });
      return true;
    } catch (error: any) {
      console.error('Error deactivating user:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to deactivate user"
      });
      return false;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password reset email sent"
      });
      return true;
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send reset email"
      });
      return false;
    }
  };

  const getUserPermissions = (user: UserProfile): { [key: string]: boolean } => {
    const permissions: { [key: string]: boolean } = {};
    
    // Set default permissions based on role
    Object.keys(defaultPermissions).forEach(permission => {
      permissions[permission] = defaultPermissions[permission as keyof typeof defaultPermissions][user.role];
    });

    // Override with user-specific permissions
    user.permissions?.forEach(perm => {
      permissions[perm.permission_type] = perm.permission_value;
    });

    return permissions;
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    createUser,
    updateUser,
    deleteUser,
    resetPassword,
    getUserPermissions,
    refetch: fetchUsers
  };
}