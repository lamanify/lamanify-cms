import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Clock, MapPin, Phone, Mail, Globe } from 'lucide-react';
import { useClinicSettings, OperatingHours } from '@/hooks/useClinicSettings';
import { useToast } from '@/hooks/use-toast';

interface BasicInfoSettingsProps {
  onBack: () => void;
}

interface BasicInfoForm {
  clinic_name: string;
  license_number: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone_primary: string;
  phone_secondary: string;
  email: string;
  timezone: string;
}

const timezones = [
  { value: 'Asia/Kuala_Lumpur', label: 'Malaysia (GMT+8)' },
  { value: 'Asia/Singapore', label: 'Singapore (GMT+8)' },
  { value: 'Asia/Jakarta', label: 'Indonesia - Jakarta (GMT+7)' },
  { value: 'Asia/Bangkok', label: 'Thailand (GMT+7)' },
  { value: 'Asia/Manila', label: 'Philippines (GMT+8)' },
  { value: 'UTC', label: 'UTC (GMT+0)' },
];

const daysOfWeek = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

export function BasicInfoSettings({ onBack }: BasicInfoSettingsProps) {
  const { getSettingValue, updateMultipleSettings, loading } = useClinicSettings();
  const { toast } = useToast();
  const [operatingHours, setOperatingHours] = useState<OperatingHours>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BasicInfoForm>({
    defaultValues: {
      clinic_name: '',
      license_number: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'Malaysia',
      phone_primary: '',
      phone_secondary: '',
      email: '',
      timezone: 'Asia/Kuala_Lumpur',
    }
  });

  useEffect(() => {
    if (!loading) {
      // Load basic info settings
      form.reset({
        clinic_name: getSettingValue('basic_info', 'clinic_name', 'My Clinic'),
        license_number: getSettingValue('basic_info', 'license_number', ''),
        address_line1: getSettingValue('basic_info', 'address_line1', ''),
        address_line2: getSettingValue('basic_info', 'address_line2', ''),
        city: getSettingValue('basic_info', 'city', ''),
        state: getSettingValue('basic_info', 'state', ''),
        postal_code: getSettingValue('basic_info', 'postal_code', ''),
        country: getSettingValue('basic_info', 'country', 'Malaysia'),
        phone_primary: getSettingValue('basic_info', 'phone_primary', ''),
        phone_secondary: getSettingValue('basic_info', 'phone_secondary', ''),
        email: getSettingValue('basic_info', 'email', ''),
        timezone: getSettingValue('basic_info', 'timezone', 'Asia/Kuala_Lumpur'),
      });

      // Load operating hours
      const hours = getSettingValue('basic_info', 'operating_hours', {});
      setOperatingHours(hours);
    }
  }, [loading, getSettingValue, form]);

  const onSubmit = async (data: BasicInfoForm) => {
    setIsSubmitting(true);
    
    const updates = [
      { category: 'basic_info', key: 'clinic_name', value: data.clinic_name },
      { category: 'basic_info', key: 'license_number', value: data.license_number },
      { category: 'basic_info', key: 'address_line1', value: data.address_line1 },
      { category: 'basic_info', key: 'address_line2', value: data.address_line2 },
      { category: 'basic_info', key: 'city', value: data.city },
      { category: 'basic_info', key: 'state', value: data.state },
      { category: 'basic_info', key: 'postal_code', value: data.postal_code },
      { category: 'basic_info', key: 'country', value: data.country },
      { category: 'basic_info', key: 'phone_primary', value: data.phone_primary },
      { category: 'basic_info', key: 'phone_secondary', value: data.phone_secondary },
      { category: 'basic_info', key: 'email', value: data.email },
      { category: 'basic_info', key: 'timezone', value: data.timezone },
      { category: 'basic_info', key: 'operating_hours', value: operatingHours },
    ];

    const success = await updateMultipleSettings(updates);
    if (success) {
      toast({
        title: "Settings Saved",
        description: "Basic clinic information has been updated successfully",
      });
    }
    
    setIsSubmitting(false);
  };

  const updateOperatingHours = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    setOperatingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
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
          <Building2 className="h-6 w-6" />
          Basic Clinic Information
        </h2>
        <p className="text-muted-foreground">
          Update your clinic's basic information, contact details, and operating hours.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Clinic Identity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Clinic Identity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clinic_name">Clinic Name *</Label>
                <Input
                  id="clinic_name"
                  {...form.register('clinic_name', { required: 'Clinic name is required' })}
                  placeholder="Enter clinic name"
                />
                {form.formState.errors.clinic_name && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.clinic_name.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="license_number">Medical License Number</Label>
                <Input
                  id="license_number"
                  {...form.register('license_number')}
                  placeholder="Enter license number"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Address Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="address_line1">Address Line 1</Label>
              <Input
                id="address_line1"
                {...form.register('address_line1')}
                placeholder="Street address"
              />
            </div>
            <div>
              <Label htmlFor="address_line2">Address Line 2 (Optional)</Label>
              <Input
                id="address_line2"
                {...form.register('address_line2')}
                placeholder="Apartment, suite, etc."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  {...form.register('city')}
                  placeholder="City"
                />
              </div>
              <div>
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  {...form.register('state')}
                  placeholder="State"
                />
              </div>
              <div>
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  {...form.register('postal_code')}
                  placeholder="Postal code"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                {...form.register('country')}
                placeholder="Country"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone_primary">Primary Phone</Label>
                <Input
                  id="phone_primary"
                  {...form.register('phone_primary')}
                  placeholder="+60123456789"
                />
              </div>
              <div>
                <Label htmlFor="phone_secondary">Secondary Phone (Optional)</Label>
                <Input
                  id="phone_secondary"
                  {...form.register('phone_secondary')}
                  placeholder="+60123456789"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                {...form.register('email')}
                placeholder="clinic@example.com"
              />
            </div>
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={form.watch('timezone')}
                onValueChange={(value) => form.setValue('timezone', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Operating Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Operating Hours
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {daysOfWeek.map((day) => (
              <div key={day.key} className="flex items-center space-x-4">
                <div className="w-24">
                  <Label>{day.label}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={!operatingHours[day.key]?.closed}
                    onCheckedChange={(checked) => updateOperatingHours(day.key, 'closed', !checked)}
                  />
                  <span className="text-sm">Open</span>
                </div>
                {!operatingHours[day.key]?.closed && (
                  <>
                    <Input
                      type="time"
                      value={operatingHours[day.key]?.open || '09:00'}
                      onChange={(e) => updateOperatingHours(day.key, 'open', e.target.value)}
                      className="w-32"
                    />
                    <span className="text-sm">to</span>
                    <Input
                      type="time"
                      value={operatingHours[day.key]?.close || '17:00'}
                      onChange={(e) => updateOperatingHours(day.key, 'close', e.target.value)}
                      className="w-32"
                    />
                  </>
                )}
                {operatingHours[day.key]?.closed && (
                  <span className="text-sm text-muted-foreground">Closed</span>
                )}
              </div>
            ))}
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