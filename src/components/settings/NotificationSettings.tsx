import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Bell, MessageSquare, Mail, AlertTriangle, Users } from 'lucide-react';
import { useClinicSettings } from '@/hooks/useClinicSettings';
import { useToast } from '@/hooks/use-toast';

interface NotificationSettingsProps {
  onBack: () => void;
}

interface NotificationForm {
  sms_enabled: boolean;
  email_enabled: boolean;
  patient_reminders: boolean;
  reminder_hours_before: number;
  staff_notifications: boolean;
  system_alerts: boolean;
}

export function NotificationSettings({ onBack }: NotificationSettingsProps) {
  const { getSettingValue, updateMultipleSettings, loading } = useClinicSettings();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<NotificationForm>({
    defaultValues: {
      sms_enabled: false,
      email_enabled: true,
      patient_reminders: true,
      reminder_hours_before: 24,
      staff_notifications: true,
      system_alerts: true,
    }
  });

  useEffect(() => {
    if (!loading) {
      form.reset({
        sms_enabled: getSettingValue('notifications', 'sms_enabled', false),
        email_enabled: getSettingValue('notifications', 'email_enabled', true),
        patient_reminders: getSettingValue('notifications', 'patient_reminders', true),
        reminder_hours_before: getSettingValue('notifications', 'reminder_hours_before', 24),
        staff_notifications: getSettingValue('notifications', 'staff_notifications', true),
        system_alerts: getSettingValue('notifications', 'system_alerts', true),
      });
    }
  }, [loading, getSettingValue, form]);

  const onSubmit = async (data: NotificationForm) => {
    setIsSubmitting(true);
    
    const updates = [
      { category: 'notifications', key: 'sms_enabled', value: data.sms_enabled },
      { category: 'notifications', key: 'email_enabled', value: data.email_enabled },
      { category: 'notifications', key: 'patient_reminders', value: data.patient_reminders },
      { category: 'notifications', key: 'reminder_hours_before', value: data.reminder_hours_before },
      { category: 'notifications', key: 'staff_notifications', value: data.staff_notifications },
      { category: 'notifications', key: 'system_alerts', value: data.system_alerts },
    ];

    const success = await updateMultipleSettings(updates);
    if (success) {
      toast({
        title: "Settings Saved",
        description: "Notification settings have been updated successfully",
      });
    }
    
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Bell className="h-6 w-6" />
          Notification Settings
        </h2>
        <p className="text-muted-foreground">
          Configure SMS, email notifications, and system alerts for your clinic.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Communication Channels */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Communication Channels
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="sms_enabled" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  SMS Notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Send SMS notifications to patients and staff (requires SMS service setup)
                </p>
              </div>
              <Switch
                id="sms_enabled"
                checked={form.watch('sms_enabled')}
                onCheckedChange={(checked) => form.setValue('sms_enabled', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="email_enabled" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Send email notifications to patients and staff
                </p>
              </div>
              <Switch
                id="email_enabled"
                checked={form.watch('email_enabled')}
                onCheckedChange={(checked) => form.setValue('email_enabled', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Patient Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Patient Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="patient_reminders">Appointment Reminders</Label>
                <p className="text-xs text-muted-foreground">
                  Send automatic reminders to patients before their appointments
                </p>
              </div>
              <Switch
                id="patient_reminders"
                checked={form.watch('patient_reminders')}
                onCheckedChange={(checked) => form.setValue('patient_reminders', checked)}
              />
            </div>
            {form.watch('patient_reminders') && (
              <div>
                <Label htmlFor="reminder_hours_before">Reminder Timing (hours before appointment)</Label>
                <Input
                  id="reminder_hours_before"
                  type="number"
                  min="1"
                  max="168"
                  {...form.register('reminder_hours_before', { 
                    required: 'Reminder timing is required',
                    min: { value: 1, message: 'Must be at least 1 hour' },
                    max: { value: 168, message: 'Cannot exceed 168 hours (7 days)' }
                  })}
                />
                {form.formState.errors.reminder_hours_before && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.reminder_hours_before.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  How many hours before the appointment to send reminder (1-168 hours)
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Staff & System Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Staff & System Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="staff_notifications">Staff Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Send notifications to staff about appointments, patient updates, and tasks
                </p>
              </div>
              <Switch
                id="staff_notifications"
                checked={form.watch('staff_notifications')}
                onCheckedChange={(checked) => form.setValue('staff_notifications', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="system_alerts">System Alerts</Label>
                <p className="text-xs text-muted-foreground">
                  Send alerts for system events, errors, and important updates
                </p>
              </div>
              <Switch
                id="system_alerts"
                checked={form.watch('system_alerts')}
                onCheckedChange={(checked) => form.setValue('system_alerts', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* SMS Setup Information */}
        {form.watch('sms_enabled') && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <MessageSquare className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-amber-800">
                    SMS Service Setup Required
                  </h4>
                  <p className="text-sm text-amber-700">
                    To use SMS notifications, you'll need to configure an SMS service provider. 
                    Contact your system administrator to set up SMS integration with providers like 
                    Twilio, AWS SNS, or local SMS gateways.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notification Types Overview */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-blue-800">Notification Types</h4>
              <div className="space-y-2 text-xs text-blue-700">
                <div><strong>Patient Reminders:</strong> Appointment confirmations and reminders</div>
                <div><strong>Staff Notifications:</strong> New appointments, patient updates, task assignments</div>
                <div><strong>System Alerts:</strong> System maintenance, security alerts, backup notifications</div>
                <div><strong>Emergency Notifications:</strong> Critical system events and urgent patient matters</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onBack}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}