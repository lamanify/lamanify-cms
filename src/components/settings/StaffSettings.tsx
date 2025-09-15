import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, UserCheck, Shield } from 'lucide-react';
import { useClinicSettings } from '@/hooks/useClinicSettings';

interface StaffSettingsProps {
  onBack: () => void;
}

export function StaffSettings({ onBack }: StaffSettingsProps) {
  const { getSettingValue, updateMultipleSettings, loading } = useClinicSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      max_doctors: 10,
      max_staff_members: 50,
      default_user_role: 'receptionist',
      require_staff_approval: true,
    }
  });

  useEffect(() => {
    if (!loading) {
      form.reset({
        max_doctors: getSettingValue('staff', 'max_doctors', 10),
        max_staff_members: getSettingValue('staff', 'max_staff_members', 50),
        default_user_role: getSettingValue('staff', 'default_user_role', 'receptionist'),
        require_staff_approval: getSettingValue('staff', 'require_staff_approval', true),
      });
    }
  }, [loading, getSettingValue, form]);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    await updateMultipleSettings([
      { category: 'staff', key: 'max_doctors', value: data.max_doctors },
      { category: 'staff', key: 'max_staff_members', value: data.max_staff_members },
      { category: 'staff', key: 'default_user_role', value: data.default_user_role },
      { category: 'staff', key: 'require_staff_approval', value: data.require_staff_approval },
    ]);
    setIsSubmitting(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          Staff & User Management
        </h2>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Staff Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Maximum Doctors</Label>
                <Input type="number" {...form.register('max_doctors')} />
              </div>
              <div>
                <Label>Maximum Staff Members</Label>
                <Input type="number" {...form.register('max_staff_members')} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Require Staff Approval</Label>
              <Switch
                checked={form.watch('require_staff_approval')}
                onCheckedChange={(checked) => form.setValue('require_staff_approval', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onBack}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}