import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Calendar, Clock, User, FileText, Activity } from 'lucide-react';
import { Patient } from '@/pages/Patients';

interface VisitHistory {
  id: string;
  visit_date: string;
  visit_time?: string;
  doctor_name: string;
  status: string;
  total_amount: number;
  payment_status: string;
  visit_summary: string;
  consultation_duration?: number;
}

interface ActivityHistory {
  id: string;
  activity_type: string;
  title: string;
  content: string;
  activity_date: string;
  staff_member_name?: string;
}

interface PatientHistoryTabProps {
  patient: Patient;
  onRefresh: () => void;
}

export function PatientHistoryTab({ patient, onRefresh }: PatientHistoryTabProps) {
  const [visitHistory, setVisitHistory] = useState<VisitHistory[]>([]);
  const [activityHistory, setActivityHistory] = useState<ActivityHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'visits' | 'activities'>('visits');

  useEffect(() => {
    if (patient?.id) {
      fetchHistoryData();
    }
  }, [patient?.id]);

  // Set up real-time subscription
  useEffect(() => {
    if (!patient?.id) return;

    const channel = supabase
      .channel('patient-history-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'patient_visits',
          filter: `patient_id=eq.${patient.id}`
        },
        () => {
          console.log('Visit history updated, refreshing...');
          fetchHistoryData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'patient_activities',
          filter: `patient_id=eq.${patient.id}`
        },
        () => {
          console.log('Activity history updated, refreshing...');
          fetchHistoryData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [patient?.id]);

  const fetchHistoryData = async () => {
    if (!patient?.id) return;

    setLoading(true);
    try {
      // Fetch visit history
      const { data: visits, error: visitsError } = await supabase
        .from('patient_visits')
        .select(`
          id,
          visit_date,
          total_amount,
          payment_status,
          visit_summary,
          created_at,
          profiles!patient_visits_doctor_id_fkey(first_name, last_name)
        `)
        .eq('patient_id', patient.id)
        .order('visit_date', { ascending: false });

      if (visitsError) throw visitsError;

      // Fetch activity history
      const { data: activities, error: activitiesError } = await supabase
        .from('patient_activities')
        .select(`
          id,
          activity_type,
          title,
          content,
          activity_date,
          created_at,
          profiles!patient_activities_staff_member_id_fkey(first_name, last_name)
        `)
        .eq('patient_id', patient.id)
        .order('activity_date', { ascending: false })
        .limit(50);

      if (activitiesError) throw activitiesError;

      // Transform visit data
      const transformedVisits: VisitHistory[] = visits?.map(visit => {
        const doctorProfile = Array.isArray(visit.profiles) ? visit.profiles[0] : visit.profiles;
        const doctorName = doctorProfile 
          ? `Dr. ${doctorProfile.first_name} ${doctorProfile.last_name}`
          : 'Unknown Doctor';

        return {
          id: visit.id,
          visit_date: visit.visit_date,
          doctor_name: doctorName,
          status: 'completed',
          total_amount: visit.total_amount || 0,
          payment_status: visit.payment_status || 'pending',
          visit_summary: visit.visit_summary || 'Visit completed'
        };
      }) || [];

      // Transform activity data
      const transformedActivities: ActivityHistory[] = activities?.map(activity => {
        const staffProfile = Array.isArray(activity.profiles) ? activity.profiles[0] : activity.profiles;
        const staffName = staffProfile 
          ? `${staffProfile.first_name} ${staffProfile.last_name}`
          : 'System';

        return {
          id: activity.id,
          activity_type: activity.activity_type,
          title: activity.title,
          content: activity.content || '',
          activity_date: activity.activity_date,
          staff_member_name: staffName
        };
      }) || [];

      setVisitHistory(transformedVisits);
      setActivityHistory(transformedActivities);
    } catch (error) {
      console.error('Error fetching history data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no_show':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'partial':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'consultation':
        return <FileText className="h-4 w-4" />;
      case 'registration':
        return <User className="h-4 w-4" />;
      case 'appointment':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-muted-foreground">Loading history...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Tab Selector */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('visits')}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'visits' 
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Visit History ({visitHistory.length})
        </button>
        <button
          onClick={() => setActiveTab('activities')}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'activities' 
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Activity Log ({activityHistory.length})
        </button>
      </div>

      {/* Visit History Tab */}
      {activeTab === 'visits' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Visit History ({visitHistory.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {visitHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No visit history found</p>
                <p className="text-sm">Visit history will appear here after consultations</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {visitHistory.map((visit, index) => (
                    <div key={visit.id}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {format(new Date(visit.visit_date), 'PPP')}
                            </span>
                            <Badge className={getStatusColor(visit.status)}>
                              {visit.status}
                            </Badge>
                            <Badge className={getPaymentStatusColor(visit.payment_status)}>
                              {visit.payment_status}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {visit.doctor_name}
                            </span>
                          </div>

                          <div className="mb-2">
                            <p className="text-sm bg-muted p-2 rounded">
                              {visit.visit_summary}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="font-medium">RM {visit.total_amount.toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground">
                            Visit #{visitHistory.length - index}
                          </div>
                        </div>
                      </div>
                      
                      {index < visitHistory.length - 1 && (
                        <Separator className="my-4" />
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}

      {/* Activity History Tab */}
      {activeTab === 'activities' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity Log ({activityHistory.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activityHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No activity history found</p>
                <p className="text-sm">Patient activities will appear here</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {activityHistory.map((activity, index) => (
                    <div key={activity.id}>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                          {getActivityIcon(activity.activity_type)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-sm">{activity.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {format(new Date(activity.activity_date), 'MMM d, yyyy HH:mm')}
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-1">
                            {activity.content}
                          </p>
                          
                          <div className="text-xs text-muted-foreground">
                            by {activity.staff_member_name}
                          </div>
                        </div>
                      </div>
                      
                      {index < activityHistory.length - 1 && (
                        <Separator className="my-4" />
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}