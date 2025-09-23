import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Patient } from '@/pages/Patients';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generatePatientId } from '@/lib/patientIdGenerator';

interface PatientBasicInfoTabProps {
  patient?: Patient | null;
  onSave: () => void;
  loading: boolean;
}

export function PatientBasicInfoTab({ patient, onSave, loading }: PatientBasicInfoTabProps) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    preferred_name: '',
    date_of_birth: '',
    gender: '',
    phone: '',
    secondary_phone: '',
    email: '',
    nric: '',
    passport: '',
    birth_cert: '',
    street_address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Malaysia',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    medical_history: '',
    allergies: '',
    insurance_info: '',
    referral_source: '',
    visit_reason: '',
    urgency_level: 'normal',
    additional_notes: ''
  });

  const { toast } = useToast();

  useEffect(() => {
    if (patient) {
      setFormData({
        first_name: patient.first_name || '',
        last_name: patient.last_name || '',
        preferred_name: patient.preferred_name || '',
        date_of_birth: patient.date_of_birth || '',
        gender: patient.gender || '',
        phone: patient.phone || '',
        secondary_phone: patient.secondary_phone || '',
        email: patient.email || '',
        nric: (patient as any).nric || '',
        passport: (patient as any).passport || '',
        birth_cert: (patient as any).birth_cert || '',
        street_address: (patient as any).street_address || '',
        city: (patient as any).city || '',
        state: (patient as any).state || '',
        postal_code: (patient as any).postal_code || '',
        country: (patient as any).country || 'Malaysia',
        address: patient.address || '',
        emergency_contact_name: patient.emergency_contact_name || '',
        emergency_contact_phone: patient.emergency_contact_phone || '',
        medical_history: patient.medical_history || '',
        allergies: patient.allergies || '',
        insurance_info: (patient as any).insurance_info || '',
        referral_source: patient.referral_source || '',
        visit_reason: patient.visit_reason || '',
        urgency_level: (patient as any).urgency_level || 'normal',
        additional_notes: patient.additional_notes || ''
      });
    }
  }, [patient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (patient) {
        // Update existing patient
        const { error } = await supabase
          .from('patients')
          .update(formData)
          .eq('id', patient.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Patient updated successfully",
        });
      } else {
        // Create new patient
        const patientId = await generatePatientId();
        
        const { error } = await supabase
          .from('patients')
          .insert({ ...formData, patient_id: patientId });

        if (error) throw error;
        
        toast({
          title: "Success", 
          description: "Patient created successfully",
        });
      }
      
      onSave();
    } catch (error) {
      console.error('Error saving patient:', error);
      toast({
        title: "Error",
        description: "Failed to save patient",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="preferred_name">Preferred Name</Label>
                <Input
                  id="preferred_name"
                  value={formData.preferred_name}
                  onChange={(e) => setFormData({ ...formData, preferred_name: e.target.value })}
                  placeholder="Nickname or preferred name"
                />
              </div>
              <div>
                <Label htmlFor="date_of_birth">Date of Birth *</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Identity Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="nric">NRIC</Label>
                <Input
                  id="nric"
                  value={formData.nric}
                  onChange={(e) => setFormData({ ...formData, nric: e.target.value })}
                  placeholder="123456-12-1234"
                />
              </div>
              <div>
                <Label htmlFor="passport">Passport</Label>
                <Input
                  id="passport"
                  value={formData.passport}
                  onChange={(e) => setFormData({ ...formData, passport: e.target.value })}
                  placeholder="Passport number"
                />
              </div>
              <div>
                <Label htmlFor="birth_cert">Birth Certificate</Label>
                <Input
                  id="birth_cert"
                  value={formData.birth_cert}
                  onChange={(e) => setFormData({ ...formData, birth_cert: e.target.value })}
                  placeholder="Birth certificate number"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Primary Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+60123456789"
                  required
                />
              </div>
              <div>
                <Label htmlFor="secondary_phone">Secondary Phone</Label>
                <Input
                  id="secondary_phone"
                  value={formData.secondary_phone}
                  onChange={(e) => setFormData({ ...formData, secondary_phone: e.target.value })}
                  placeholder="Alternative phone number"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="patient@email.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Address Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="street_address">Street Address</Label>
                <Input
                  id="street_address"
                  value={formData.street_address}
                  onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                  placeholder="Street address"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Select value={formData.state} onValueChange={(value) => setFormData({ ...formData, state: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Johor">Johor</SelectItem>
                      <SelectItem value="Kedah">Kedah</SelectItem>
                      <SelectItem value="Kelantan">Kelantan</SelectItem>
                      <SelectItem value="Malacca">Malacca</SelectItem>
                      <SelectItem value="Negeri Sembilan">Negeri Sembilan</SelectItem>
                      <SelectItem value="Pahang">Pahang</SelectItem>
                      <SelectItem value="Penang">Penang</SelectItem>
                      <SelectItem value="Perak">Perak</SelectItem>
                      <SelectItem value="Perlis">Perlis</SelectItem>
                      <SelectItem value="Sabah">Sabah</SelectItem>
                      <SelectItem value="Sarawak">Sarawak</SelectItem>
                      <SelectItem value="Selangor">Selangor</SelectItem>
                      <SelectItem value="Terengganu">Terengganu</SelectItem>
                      <SelectItem value="Federal Territory of Kuala Lumpur">Federal Territory of Kuala Lumpur</SelectItem>
                      <SelectItem value="Federal Territory of Labuan">Federal Territory of Labuan</SelectItem>
                      <SelectItem value="Federal Territory of Putrajaya">Federal Territory of Putrajaya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="postal_code">Postal Code</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    placeholder="12345"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Malaysia"
                />
              </div>
              <div>
                <Label htmlFor="address">Full Address (Legacy)</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Complete address"
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Emergency Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                <Input
                  id="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                  placeholder="Full name"
                />
              </div>
              <div>
                <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                <Input
                  id="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                  placeholder="+60123456789"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Medical Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="medical_history">Medical History</Label>
              <Textarea
                id="medical_history"
                value={formData.medical_history}
                onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                placeholder="Previous medical conditions, surgeries, etc."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="allergies">Allergies</Label>
              <Textarea
                id="allergies"
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                placeholder="Food allergies, drug allergies, etc."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="insurance_info">Insurance Information</Label>
                <Input
                  id="insurance_info"
                  value={formData.insurance_info}
                  onChange={(e) => setFormData({ ...formData, insurance_info: e.target.value })}
                  placeholder="Insurance details"
                />
              </div>
              <div>
                <Label htmlFor="referral_source">Referral Source</Label>
                <Input
                  id="referral_source"
                  value={formData.referral_source}
                  onChange={(e) => setFormData({ ...formData, referral_source: e.target.value })}
                  placeholder="How did you hear about us?"
                />
              </div>
              <div>
                <Label htmlFor="visit_reason">Visit Reason</Label>
                <Input
                  id="visit_reason"
                  value={formData.visit_reason}
                  onChange={(e) => setFormData({ ...formData, visit_reason: e.target.value })}
                  placeholder="Reason for visit"
                />
              </div>
              <div>
                <Label htmlFor="urgency_level">Urgency Level</Label>
                <Select value={formData.urgency_level} onValueChange={(value) => setFormData({ ...formData, urgency_level: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select urgency level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="additional_notes">Additional Notes</Label>
              <Textarea
                id="additional_notes"
                value={formData.additional_notes}
                onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
                placeholder="Any additional information"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {patient ? 'Update Patient' : 'Create Patient'}
          </Button>
        </div>
      </form>
    </div>
  );
}