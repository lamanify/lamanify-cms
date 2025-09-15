import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Users, Clock, Hash, Globe } from 'lucide-react';
import { useClinicSettings } from '@/hooks/useClinicSettings';
import { useToast } from '@/hooks/use-toast';

interface SystemSettingsProps {
  onBack: () => void;
}

interface SystemForm {
  patient_id_format: string;
  patient_id_prefix: string;
  queue_auto_reset: boolean;
  max_queue_size: number;
  consultation_timeout_minutes: number;
  default_appointment_duration: number;
  enable_patient_portal: boolean;
}

const patientIdFormats = [
  { value: 'numeric', label: 'Numeric (123456)' },
  { value: 'alphanumeric', label: 'Alphanumeric (ABC123)' },
];

export function SystemSettings({ onBack }: SystemSettingsProps) {
  const { getSettingValue, updateMultipleSettings, loading } = useClinicSettings();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SystemForm>({
    defaultValues: {
      patient_id_format: 'numeric',
      patient_id_prefix: '',
      queue_auto_reset: true,
      max_queue_size: 100,
      consultation_timeout_minutes: 60,
      default_appointment_duration: 30,
      enable_patient_portal: false,
    }
  });

  useEffect(() => {
    if (!loading) {
      form.reset({
        patient_id_format: getSettingValue('system', 'patient_id_format', 'numeric'),
        patient_id_prefix: getSettingValue('system', 'patient_id_prefix', ''),
        queue_auto_reset: getSettingValue('system', 'queue_auto_reset', true),
        max_queue_size: getSettingValue('system', 'max_queue_size', 100),
        consultation_timeout_minutes: getSettingValue('system', 'consultation_timeout_minutes', 60),
        default_appointment_duration: getSettingValue('system', 'default_appointment_duration', 30),
        enable_patient_portal: getSettingValue('system', 'enable_patient_portal', false),
      });
    }
  }, [loading, getSettingValue, form]);

  const onSubmit = async (data: SystemForm) => {
    setIsSubmitting(true);
    
    const updates = [
      { category: 'system', key: 'patient_id_format', value: data.patient_id_format },
      { category: 'system', key: 'patient_id_prefix', value: data.patient_id_prefix },
      { category: 'system', key: 'queue_auto_reset', value: data.queue_auto_reset },
      { category: 'system', key: 'max_queue_size', value: data.max_queue_size },
      { category: 'system', key: 'consultation_timeout_minutes', value: data.consultation_timeout_minutes },
      { category: 'system', key: 'default_appointment_duration', value: data.default_appointment_duration },
      { category: 'system', key: 'enable_patient_portal', value: data.enable_patient_portal },
    ];

    const success = await updateMultipleSettings(updates);
    if (success) {
      toast({
        title: "Settings Saved",
        description: "System preferences have been updated successfully",
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
          <Settings className="h-6 w-6" />
          System Preferences
        </h2>
        <p className="text-muted-foreground">
          Configure system-wide preferences for patient registration, queue management, and appointments.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Patient Registration Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Patient Registration Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="patient_id_format">Patient ID Format</Label>
                <Select
                  value={form.watch('patient_id_format')}
                  onValueChange={(value) => form.setValue('patient_id_format', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {patientIdFormats.map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        {format.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Format for auto-generated patient IDs
                </p>
              </div>
              <div>
                <Label htmlFor="patient_id_prefix">Patient ID Prefix (Optional)</Label>
                <Input
                  id="patient_id_prefix"
                  {...form.register('patient_id_prefix')}
                  placeholder="e.g., PAT, CLI"
                  maxLength={5}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Optional prefix for patient IDs (max 5 characters)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Queue Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Queue Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="queue_auto_reset">Auto-reset Queue Daily</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically reset the queue at midnight each day
                </p>
              </div>
              <Switch
                id="queue_auto_reset"
                checked={form.watch('queue_auto_reset')}
                onCheckedChange={(checked) => form.setValue('queue_auto_reset', checked)}
              />
            </div>
            <div>
              <Label htmlFor="max_queue_size">Maximum Queue Size</Label>
              <Input
                id="max_queue_size"
                type="number"
                min="10"
                max="500"
                {...form.register('max_queue_size', { 
                  required: 'Maximum queue size is required',
                  min: { value: 10, message: 'Must be at least 10' },
                  max: { value: 500, message: 'Cannot exceed 500' }
                })}
              />
              {form.formState.errors.max_queue_size && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.max_queue_size.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Maximum number of patients that can be in the queue per day
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Consultation & Appointment Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Consultation & Appointment Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="consultation_timeout_minutes">Consultation Timeout (minutes)</Label>
                <Input
                  id="consultation_timeout_minutes"
                  type="number"
                  min="15"
                  max="240"
                  {...form.register('consultation_timeout_minutes', { 
                    required: 'Consultation timeout is required',
                    min: { value: 15, message: 'Must be at least 15 minutes' },
                    max: { value: 240, message: 'Cannot exceed 240 minutes' }
                  })}
                />
                {form.formState.errors.consultation_timeout_minutes && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.consultation_timeout_minutes.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Automatic timeout for active consultations
                </p>
              </div>
              <div>
                <Label htmlFor="default_appointment_duration">Default Appointment Duration (minutes)</Label>
                <Input
                  id="default_appointment_duration"
                  type="number"
                  min="15"
                  max="120"
                  {...form.register('default_appointment_duration', { 
                    required: 'Default appointment duration is required',
                    min: { value: 15, message: 'Must be at least 15 minutes' },
                    max: { value: 120, message: 'Cannot exceed 120 minutes' }
                  })}
                />
                {form.formState.errors.default_appointment_duration && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.default_appointment_duration.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Default duration when creating new appointments
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Patient Portal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Patient Portal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="enable_patient_portal">Enable Patient Portal</Label>
                <p className="text-xs text-muted-foreground">
                  Allow patients to view their records and book appointments online
                </p>
              </div>
              <Switch
                id="enable_patient_portal"
                checked={form.watch('enable_patient_portal')}
                onCheckedChange={(checked) => form.setValue('enable_patient_portal', checked)}
              />
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