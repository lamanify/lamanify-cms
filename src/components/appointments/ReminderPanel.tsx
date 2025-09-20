import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Bell, Mail, MessageSquare, Phone, Clock, User } from 'lucide-react';
import { format } from 'date-fns';

interface ReminderActivity {
  id: string;
  activity_date: string;
  content: string;
  metadata: any; // Using any to handle Json type from Supabase
  patients: {
    first_name: string;
    last_name: string;
  };
}

export function ReminderPanel() {
  const [loading, setLoading] = useState(false);
  const [recentReminders, setRecentReminders] = useState<ReminderActivity[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<string>('');
  const [reminderType, setReminderType] = useState<string>('email');

  useEffect(() => {
    fetchRecentReminders();
    fetchUpcomingAppointments();
  }, []);

  const fetchRecentReminders = async () => {
    try {
      const { data, error } = await supabase
        .from('patient_activities')
        .select(`
          id,
          activity_date,
          content,
          metadata,
          patients (
            first_name,
            last_name
          )
        `)
        .eq('activity_type', 'reminder_sent')
        .order('activity_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentReminders(data || []);
    } catch (error) {
      console.error('Error fetching recent reminders:', error);
    }
  };

  const fetchUpcomingAppointments = async () => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          patients (
            id,
            first_name,
            last_name,
            phone,
            email
          ),
          profiles (
            first_name,
            last_name
          )
        `)
        .eq('status', 'scheduled')
        .gte('appointment_date', tomorrow.toISOString().split('T')[0])
        .lte('appointment_date', nextWeek.toISOString().split('T')[0])
        .order('appointment_date')
        .order('appointment_time');

      if (error) throw error;
      setUpcomingAppointments(data || []);
    } catch (error) {
      console.error('Error fetching upcoming appointments:', error);
    }
  };

  const scheduleAutomaticReminders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('appointment-reminders', {
        body: { type: 'schedule' }
      });

      if (error) throw error;

      toast({
        title: "Reminders scheduled",
        description: `${data.sent} reminders sent successfully`,
      });

      fetchRecentReminders();
    } catch (error) {
      console.error('Error scheduling reminders:', error);
      toast({
        title: "Error",
        description: "Failed to schedule reminders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendManualReminder = async () => {
    if (!selectedAppointment) {
      toast({
        title: "No appointment selected",
        description: "Please select an appointment to send reminder",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('appointment-reminders', {
        body: {
          type: 'send_now',
          appointment_id: selectedAppointment,
          reminder_type: reminderType
        }
      });

      if (error) throw error;

      toast({
        title: "Reminder sent",
        description: `${reminderType} reminder sent successfully`,
      });

      fetchRecentReminders();
      setSelectedAppointment('');
    } catch (error) {
      console.error('Error sending manual reminder:', error);
      toast({
        title: "Error",
        description: "Failed to send reminder",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'sms':
        return <MessageSquare className="w-4 h-4" />;
      case 'whatsapp':
        return <Phone className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'email':
        return 'bg-blue-100 text-blue-800';
      case 'sms':
        return 'bg-green-100 text-green-800';
      case 'whatsapp':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Manual Reminder Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <span>Send Reminders</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <Button 
              onClick={scheduleAutomaticReminders}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <Clock className="w-4 h-4" />
              <span>{loading ? 'Scheduling...' : 'Send Auto Reminders'}</span>
            </Button>

            <div className="text-sm text-muted-foreground self-center">
              Sends reminders for appointments in the next 24-48 hours
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Send Manual Reminder</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Appointment</label>
                <Select value={selectedAppointment} onValueChange={setSelectedAppointment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose appointment" />
                  </SelectTrigger>
                  <SelectContent>
                    {upcomingAppointments.map((apt) => (
                      <SelectItem key={apt.id} value={apt.id}>
                        {apt.patients.first_name} {apt.patients.last_name} - {format(new Date(apt.appointment_date), 'MMM d')} at {apt.appointment_time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Reminder Type</label>
                <Select value={reminderType} onValueChange={setReminderType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">&nbsp;</label>
                <Button 
                  onClick={sendManualReminder}
                  disabled={loading || !selectedAppointment}
                  className="w-full"
                >
                  Send Reminder
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Reminders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reminders</CardTitle>
        </CardHeader>
        <CardContent>
          {recentReminders.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No reminders sent recently
            </div>
          ) : (
            <div className="space-y-3">
              {recentReminders.map((reminder) => (
                <div key={reminder.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">
                        {reminder.patients.first_name} {reminder.patients.last_name}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(reminder.metadata.appointment_date), 'MMM d')} at {reminder.metadata.appointment_time}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      with {reminder.metadata.doctor_name}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant="secondary" 
                      className={`flex items-center space-x-1 ${getMethodColor(reminder.metadata.reminder_method)}`}
                    >
                      {getMethodIcon(reminder.metadata.reminder_method)}
                      <span className="capitalize">{reminder.metadata.reminder_method}</span>
                    </Badge>
                    {reminder.metadata.manual_send && (
                      <Badge variant="outline" className="text-xs">
                        Manual
                      </Badge>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(reminder.activity_date), 'MMM d, h:mm a')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}