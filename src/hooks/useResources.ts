import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Resource {
  id?: string;
  name: string;
  type: 'room' | 'equipment' | 'device';
  description?: string;
  capacity?: number;
  status?: 'active' | 'inactive' | 'maintenance';
  location?: string;
  availability_schedule?: any;
}

export const useResources = () => {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('status', 'active')
        .order('type')
        .order('name');

      if (error) throw error;
      setResources(data || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast.error('Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  };

  const createResource = async (resource: Resource) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('resources')
        .insert([resource])
        .select()
        .single();

      if (error) throw error;

      toast.success('Resource created successfully');
      await fetchResources();
      return data;
    } catch (error) {
      console.error('Error creating resource:', error);
      toast.error('Failed to create resource');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateResource = async (id: string, updates: Partial<Resource>) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('resources')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast.success('Resource updated successfully');
      await fetchResources();
    } catch (error) {
      console.error('Error updating resource:', error);
      toast.error('Failed to update resource');
    } finally {
      setLoading(false);
    }
  };

  const deleteResource = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('resources')
        .update({ status: 'inactive' })
        .eq('id', id);

      if (error) throw error;

      toast.success('Resource deleted successfully');
      await fetchResources();
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast.error('Failed to delete resource');
    } finally {
      setLoading(false);
    }
  };

  const checkResourceAvailability = async (
    resourceId: string,
    appointmentDate: string,
    appointmentTime: string,
    durationMinutes: number,
    excludeAppointmentId?: string
  ) => {
    try {
      const { data, error } = await supabase.rpc('check_resource_availability', {
        p_resource_id: resourceId,
        p_appointment_date: appointmentDate,
        p_appointment_time: appointmentTime,
        p_duration_minutes: durationMinutes,
        p_exclude_appointment_id: excludeAppointmentId
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error checking resource availability:', error);
      return false;
    }
  };

  const assignResourceToAppointment = async (appointmentId: string, resourceIds: string[]) => {
    setLoading(true);
    try {
      // Remove existing assignments
      await supabase
        .from('appointment_resources')
        .delete()
        .eq('appointment_id', appointmentId);

      // Add new assignments
      if (resourceIds.length > 0) {
        const assignments = resourceIds.map(resourceId => ({
          appointment_id: appointmentId,
          resource_id: resourceId
        }));

        const { error } = await supabase
          .from('appointment_resources')
          .insert(assignments);

        if (error) throw error;
      }

      toast.success('Resources assigned successfully');
    } catch (error) {
      console.error('Error assigning resources:', error);
      toast.error('Failed to assign resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  return {
    resources,
    loading,
    fetchResources,
    createResource,
    updateResource,
    deleteResource,
    checkResourceAvailability,
    assignResourceToAppointment
  };
};