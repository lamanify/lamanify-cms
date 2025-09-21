import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PanelSelector } from '@/components/patients/PanelSelector';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Search, UserPlus } from 'lucide-react';

interface PatientData {
  id?: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  date_of_birth: string;
  gender: string;
  panel_id?: string;
  isExisting?: boolean;
}

interface PatientSelfRegistrationProps {
  onSubmit: (data: PatientData) => void;
}

export function PatientSelfRegistration({ onSubmit }: PatientSelfRegistrationProps) {
  const [activeTab, setActiveTab] = useState('existing');
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Existing patient search
  const [searchPhone, setSearchPhone] = useState('');
  const [foundPatient, setFoundPatient] = useState<PatientData | null>(null);
  
  // New patient form
  const [newPatientData, setNewPatientData] = useState<Omit<PatientData, 'id'>>({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    gender: '',
    panel_id: '',
  });

  const searchExistingPatient = async () => {
    if (!searchPhone.trim()) {
      toast({
        title: "Phone number required",
        description: "Please enter your phone number to search",
        variant: "destructive",
      });
      return;
    }

    setSearchLoading(true);
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, first_name, last_name, phone, email, date_of_birth, gender')
        .eq('phone', searchPhone.trim())
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setFoundPatient({ ...data, isExisting: true });
        toast({
          title: "Patient found",
          description: `Welcome back, ${data.first_name} ${data.last_name}!`,
        });
      } else {
        setFoundPatient(null);
        toast({
          title: "Patient not found",
          description: "No patient found with this phone number. Please register as a new patient.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error searching patient:', error);
      toast({
        title: "Search failed",
        description: "Unable to search for patient. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleExistingPatientSubmit = () => {
    if (!foundPatient) return;
    onSubmit(foundPatient);
  };

  const handleNewPatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPatientData.first_name || !newPatientData.last_name || !newPatientData.phone || 
        !newPatientData.date_of_birth || !newPatientData.gender) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create new patient
      const { data: newPatient, error: insertError } = await supabase
        .from('patients')
        .insert({
          first_name: newPatientData.first_name,
          last_name: newPatientData.last_name,
          phone: newPatientData.phone,
          email: newPatientData.email || null,
          date_of_birth: newPatientData.date_of_birth,
          gender: newPatientData.gender.toLowerCase(),
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Auto-assign tier if panel is selected
      if (newPatientData.panel_id) {
        // Get default tier for this panel
        const { data: panelTiers } = await supabase
          .from('panels_price_tiers')
          .select('tier_id, is_default_tier')
          .eq('panel_id', newPatientData.panel_id)
          .eq('is_default_tier', true)
          .single();

        if (panelTiers) {
          await supabase
            .from('patients')
            .update({ assigned_tier_id: panelTiers.tier_id })
            .eq('id', newPatient.id);
        }
      }

      toast({
        title: "Registration successful",
        description: "Your information has been saved successfully",
      });

      onSubmit({ ...newPatient, panel_id: newPatientData.panel_id, isExisting: false });
    } catch (error) {
      console.error('Error creating patient:', error);
      toast({
        title: "Registration failed",
        description: "Unable to register patient. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="existing" className="flex items-center space-x-2">
            <Search className="w-4 h-4" />
            <span>Existing Patient</span>
          </TabsTrigger>
          <TabsTrigger value="new" className="flex items-center space-x-2">
            <UserPlus className="w-4 h-4" />
            <span>New Patient</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="existing" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="search_phone">Enter your phone number</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="search_phone"
                      type="tel"
                      placeholder="Phone number"
                      value={searchPhone}
                      onChange={(e) => setSearchPhone(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchExistingPatient()}
                      className="flex-1"
                    />
                    <Button 
                      onClick={searchExistingPatient} 
                      disabled={searchLoading}
                      className="flex items-center space-x-2"
                    >
                      <Search className="w-4 h-4" />
                      <span>{searchLoading ? 'Searching...' : 'Search'}</span>
                    </Button>
                  </div>
                </div>

                {foundPatient && (
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="pt-4">
                      <h3 className="font-semibold text-green-800 mb-2">Patient Found!</h3>
                      <div className="space-y-1 text-sm text-green-700">
                        <p><span className="font-medium">Name:</span> {foundPatient.first_name} {foundPatient.last_name}</p>
                        <p><span className="font-medium">Phone:</span> {foundPatient.phone}</p>
                        <p><span className="font-medium">Email:</span> {foundPatient.email || 'Not provided'}</p>
                        <p><span className="font-medium">Date of Birth:</span> {foundPatient.date_of_birth}</p>
                      </div>
                      <Button 
                        onClick={handleExistingPatientSubmit}
                        className="w-full mt-4"
                        disabled={loading}
                      >
                        Continue with this information
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="new" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleNewPatientSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      value={newPatientData.first_name}
                      onChange={(e) => setNewPatientData({ ...newPatientData, first_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      value={newPatientData.last_name}
                      onChange={(e) => setNewPatientData({ ...newPatientData, last_name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={newPatientData.phone}
                    onChange={(e) => setNewPatientData({ ...newPatientData, phone: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newPatientData.email}
                    onChange={(e) => setNewPatientData({ ...newPatientData, email: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date of Birth *</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={newPatientData.date_of_birth}
                      onChange={(e) => setNewPatientData({ ...newPatientData, date_of_birth: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender *</Label>
                    <Select
                      value={newPatientData.gender}
                      onValueChange={(value) => setNewPatientData({ ...newPatientData, gender: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <PanelSelector
                    selectedPanelId={newPatientData.panel_id}
                    onPanelSelect={(panelId) => {
                      setNewPatientData({ ...newPatientData, panel_id: panelId || '' });
                    }}
                    showLabel={true}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Register & Continue'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
