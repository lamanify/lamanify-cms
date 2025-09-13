import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, User, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Patient } from '@/pages/Patients';

interface PatientSearchProps {
  onPatientSelect: (patient: Patient) => void;
  placeholder?: string;
}

export function PatientSearch({ onPatientSelect, placeholder = "Search existing patients by name or phone..." }: PatientSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Patient[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchPatients = async () => {
      if (searchTerm.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('patients')
          .select('*')
          .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
          .limit(5);

        if (error) throw error;
        setSuggestions(data || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error searching patients:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchPatients, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handlePatientSelect = (patient: Patient) => {
    setSearchTerm(`${patient.first_name} ${patient.last_name}`);
    setShowSuggestions(false);
    onPatientSelect(patient);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div ref={searchRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          className="pl-10 pr-20"
        />
        {searchTerm && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1 h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            Clear
          </Button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto">
          <CardContent className="p-0">
            {suggestions.map((patient) => (
              <div
                key={patient.id}
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted transition-colors border-b last:border-b-0"
                onClick={() => handlePatientSelect(patient)}
              >
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {patient.first_name} {patient.last_name}
                    {patient.preferred_name && (
                      <span className="text-muted-foreground ml-1">({patient.preferred_name})</span>
                    )}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {patient.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {patient.phone}
                      </div>
                    )}
                    <span>Age: {calculateAge(patient.date_of_birth)}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1">
          <CardContent className="p-4 text-center text-muted-foreground">
            Searching...
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function calculateAge(dateOfBirth: string) {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}