import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
      const { data, error } = await supabase
        .from('patients')
        .insert([newPatientData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Registration successful",
        description: "Your information has been saved successfully",
      });

      onSubmit({ ...data, isExisting: false });
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
                <div className="text-center text-muted-foreground mb-4">
                  Enter your phone number to find your existing record
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="search-phone">Phone Number</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="search-phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={searchPhone}
                      onChange={(e) => setSearchPhone(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchExistingPatient()}
                    />
                    <Button 
                      onClick={searchExistingPatient} 
                      disabled={searchLoading}
                      variant="outline"
                    >
                      {searchLoading ? 'Searching...' : 'Search'}
                    </Button>
                  </div>
                </div>

                {foundPatient && (
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">Patient Found:</h4>
                        <p><strong>Name:</strong> {foundPatient.first_name} {foundPatient.last_name}</p>
                        <p><strong>Phone:</strong> {foundPatient.phone}</p>
                        {foundPatient.email && <p><strong>Email:</strong> {foundPatient.email}</p>}
                        <p><strong>Date of Birth:</strong> {foundPatient.date_of_birth}</p>
                        <p><strong>Gender:</strong> {foundPatient.gender}</p>
                      </div>
                      <Button 
                        onClick={handleExistingPatientSubmit}
                        className="w-full mt-4"
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
                    <Label htmlFor="gender">Gender *</Label>
                    <Select
                      value={newPatientData.gender}
                      onValueChange={(value) => setNewPatientData({ ...newPatientData, gender: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
