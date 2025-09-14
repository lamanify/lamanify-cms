import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PatientActivity {
  id: string;
  patient_id: string;
  activity_type: 'consultation' | 'medication' | 'payment' | 'communication' | 'appointment' | 'vital_signs' | 'lab_results' | 'system_note';
  activity_date: string;
  staff_member_id?: string;
  title: string;
  content?: string;
  metadata?: any;
  related_record_id?: string;
  status: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  // Joined staff data
  staff_member?: {
    first_name: string;
    last_name: string;
    role: string;
  };
}

export interface PatientMedication {
  id: string;
  patient_id: string;
  medication_name: string;
  dosage?: string;
  frequency?: string;
  prescribed_date: string;
  prescribed_by?: string;
  refill_date?: string;
  status: 'active' | 'discontinued' | 'completed';
  notes?: string;
  // Joined prescriber data
  prescriber?: {
    first_name: string;
    last_name: string;
  };
}

export function usePatientActivities(patientId?: string) {
  const [activities, setActivities] = useState<PatientActivity[]>([]);
  const [medications, setMedications] = useState<PatientMedication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityFilters, setActivityFilters] = useState({
    type: 'all',
    dateRange: 'all-time',
    search: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (patientId) {
      fetchActivities();
      fetchCurrentMedications();
      
      // Set up real-time subscription for activities
      const channel = supabase
        .channel(`patient-activities-${patientId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'patient_activities',
            filter: `patient_id=eq.${patientId}`
          },
          () => {
            fetchActivities();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [patientId]);

  const fetchActivities = async () => {
    if (!patientId) return;
    
    try {
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('patient_activities')
        .select(`
          *,
          staff_member:profiles!staff_member_id (
            first_name,
            last_name,
            role
          )
        `)
        .eq('patient_id', patientId)
        .order('activity_date', { ascending: false });

      if (activitiesError) throw activitiesError;
      setActivities((activitiesData || []) as PatientActivity[]);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({
        title: "Error",
        description: "Failed to fetch patient activities",
        variant: "destructive",
      });
    }
  };

  const fetchCurrentMedications = async () => {
    if (!patientId) return;
    
    try {
      const { data: medicationsData, error: medicationsError } = await supabase
        .from('patient_current_medications')
        .select(`
          *,
          prescriber:profiles!prescribed_by (
            first_name,
            last_name
          )
        `)
        .eq('patient_id', patientId)
        .eq('status', 'active')
        .order('prescribed_date', { ascending: false });

      if (medicationsError) throw medicationsError;
      setMedications((medicationsData || []) as PatientMedication[]);
    } catch (error) {
      console.error('Error fetching medications:', error);
    } finally {
      setLoading(false);
    }
  };

  const createActivity = async (activityData: Omit<PatientActivity, 'id' | 'created_at' | 'updated_at' | 'staff_member'>) => {
    try {
      const { data, error } = await supabase
        .from('patient_activities')
        .insert(activityData)
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Activity Logged",
        description: `${activityData.title} has been recorded`,
      });
      
      return data;
    } catch (error) {
      console.error('Error creating activity:', error);
      toast({
        title: "Error",
        description: "Failed to log activity",
        variant: "destructive",
      });
      throw error;
    }
  };

  const addMedication = async (medicationData: Omit<PatientMedication, 'id' | 'created_at' | 'updated_at' | 'prescriber'>) => {
    try {
      const { data, error } = await supabase
        .from('patient_current_medications')
        .insert(medicationData)
        .select()
        .single();

      if (error) throw error;
      
      // Also create an activity log for the medication
      await createActivity({
        patient_id: patientId!,
        activity_type: 'medication',
        activity_date: new Date().toISOString(),
        title: `Prescribed ${medicationData.medication_name}`,
        content: `Dosage: ${medicationData.dosage}, Frequency: ${medicationData.frequency}`,
        metadata: {
          medication_name: medicationData.medication_name,
          dosage: medicationData.dosage,
          frequency: medicationData.frequency
        },
        staff_member_id: medicationData.prescribed_by,
        priority: 'normal',
        status: 'active'
      });
      
      await fetchCurrentMedications();
      return data;
    } catch (error) {
      console.error('Error adding medication:', error);
      toast({
        title: "Error",
        description: "Failed to add medication",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getFilteredActivities = () => {
    let filtered = activities;

    // Filter by type
    if (activityFilters.type !== 'all') {
      filtered = filtered.filter(activity => activity.activity_type === activityFilters.type);
    }

    // Filter by date range
    if (activityFilters.dateRange !== 'all-time') {
      const now = new Date();
      let cutoffDate = new Date();
      
      switch (activityFilters.dateRange) {
        case '7-days':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case '30-days':
          cutoffDate.setDate(now.getDate() - 30);
          break;
        case '3-months':
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
      }
      
      filtered = filtered.filter(activity => 
        new Date(activity.activity_date) >= cutoffDate
      );
    }

    // Filter by search
    if (activityFilters.search) {
      const searchLower = activityFilters.search.toLowerCase();
      filtered = filtered.filter(activity =>
        activity.title.toLowerCase().includes(searchLower) ||
        activity.content?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  };

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case 'consultation':
        return 'text-[#e9204f] bg-[#e9204f]/10 border-[#e9204f]/20';
      case 'medication':
        return 'text-blue-600 bg-blue-600/10 border-blue-600/20';
      case 'payment':
        return 'text-green-600 bg-green-600/10 border-green-600/20';
      case 'communication':
        return 'text-orange-600 bg-orange-600/10 border-orange-600/20';
      case 'appointment':
        return 'text-purple-600 bg-purple-600/10 border-purple-600/20';
      case 'vital_signs':
        return 'text-cyan-600 bg-cyan-600/10 border-cyan-600/20';
      case 'lab_results':
        return 'text-indigo-600 bg-indigo-600/10 border-indigo-600/20';
      case 'system_note':
      default:
        return 'text-gray-600 bg-gray-600/10 border-gray-600/20';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'consultation':
        return '🩺';
      case 'medication':
        return '💊';
      case 'payment':
        return '💳';
      case 'communication':
        return '📞';
      case 'appointment':
        return '📅';
      case 'vital_signs':
        return '🫀';
      case 'lab_results':
        return '🧪';
      case 'system_note':
      default:
        return '📝';
    }
  };

  return {
    activities,
    medications,
    loading,
    activityFilters,
    setActivityFilters,
    getFilteredActivities,
    getActivityTypeColor,
    getActivityIcon,
    createActivity,
    addMedication,
    fetchActivities,
    fetchCurrentMedications
  };
}