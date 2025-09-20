import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Patient } from '@/pages/Patients';
import { PatientViewToggle } from './PatientViewToggle';
import { AdvancedFilterPanel } from './AdvancedFilterPanel';
import { PatientDataTable } from './PatientDataTable';
import { EnhancedPatientCard } from './EnhancedPatientCard';
import { BulkActionToolbar } from './BulkActionToolbar';
import { UnifiedPatientModal } from './UnifiedPatientModal';
import { toast } from 'sonner';

interface EnhancedPatient extends Patient {
  last_visit_date?: string;
  total_visits: number;
  amount_spent: number;
  visit_frequency: 'new' | 'regular' | 'frequent' | 'inactive';
  status_indicator: 'active' | 'follow_up' | 'overdue' | 'inactive';
  age: number;
}

interface FilterCriteria {
  searchTerm: string;
  ageRange: [number, number];
  gender: string;
  visitFrequency: string;
  dateRange: {
    start: string;
    end: string;
  };
  diagnosis: string;
  amountSpentRange: [number, number];
}

interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  sortable: boolean;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: 'name', label: 'Name', visible: true, sortable: true },
  { key: 'patient_id', label: 'Patient ID', visible: true, sortable: true },
  { key: 'phone', label: 'Phone', visible: true, sortable: false },
  { key: 'age', label: 'Age', visible: true, sortable: true },
  { key: 'last_visit_date', label: 'Last Visit', visible: true, sortable: true },
  { key: 'total_visits', label: 'Total Visits', visible: true, sortable: true },
  { key: 'amount_spent', label: 'Amount Spent', visible: true, sortable: true },
  { key: 'actions', label: 'Actions', visible: true, sortable: false }
];

export function PatientListTab() {
  const [patients, setPatients] = useState<EnhancedPatient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<EnhancedPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table'); // Default to table view
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [filters, setFilters] = useState<FilterCriteria>({
    searchTerm: '',
    ageRange: [0, 120],
    gender: '',
    visitFrequency: '',
    dateRange: { start: '', end: '' },
    diagnosis: '',
    amountSpentRange: [0, 100000]
  });

  const [showPatientModal, setShowPatientModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<EnhancedPatient | null>(null);
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({ key: 'created_at', direction: 'desc' });

  const fetchPatientsWithAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch patients
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (patientsError) throw patientsError;

      // Fetch appointments data for analytics
      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select('patient_id, appointment_date, status');

      // Fetch billing data for additional analytics
      const { data: billingData } = await supabase
        .from('billing')
        .select('patient_id, created_at, amount');

      // Process and enhance patient data
      const enhancedPatients: EnhancedPatient[] = (patientsData || []).map(patient => {
        const patientAppointments = appointmentsData?.filter(apt => apt.patient_id === patient.id) || [];
        const patientBilling = billingData?.filter(bill => bill.patient_id === patient.id) || [];
        
        const totalVisits = patientAppointments.length + patientBilling.length;
        const lastVisitDate = patientAppointments.length > 0 
          ? Math.max(...patientAppointments.map(v => new Date(v.appointment_date).getTime()))
          : null;
        
        const amountSpent = patientBilling.reduce((sum, bill) => sum + (bill.amount || 0), 0);
        
        // Calculate visit frequency
        let visitFrequency: 'new' | 'regular' | 'frequent' | 'inactive' = 'new';
        if (totalVisits === 0) visitFrequency = 'new';
        else if (totalVisits >= 10) visitFrequency = 'frequent';
        else if (totalVisits >= 3) visitFrequency = 'regular';
        else if (lastVisitDate && (Date.now() - lastVisitDate) > (90 * 24 * 60 * 60 * 1000)) {
          visitFrequency = 'inactive';
        }

        // Calculate status indicator
        let statusIndicator: 'active' | 'follow_up' | 'overdue' | 'inactive' = 'active';
        if (lastVisitDate) {
          const daysSinceLastVisit = (Date.now() - lastVisitDate) / (24 * 60 * 60 * 1000);
          if (daysSinceLastVisit > 180) statusIndicator = 'inactive';
          else if (daysSinceLastVisit > 90) statusIndicator = 'overdue';
          else if (daysSinceLastVisit > 30) statusIndicator = 'follow_up';
        }

        const age = calculateAge(patient.date_of_birth);

        return {
          ...patient,
          last_visit_date: lastVisitDate ? new Date(lastVisitDate).toISOString() : undefined,
          total_visits: totalVisits,
          amount_spent: amountSpent,
          visit_frequency: visitFrequency,
          status_indicator: statusIndicator,
          age
        };
      });

      setPatients(enhancedPatients);
      setFilteredPatients(enhancedPatients);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientsWithAnalytics();
  }, []);

  // Apply filters and sorting
  const processedPatients = useMemo(() => {
    let filtered = [...patients];

    // Apply search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(patient =>
        `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchLower) ||
        patient.phone?.toLowerCase().includes(searchLower) ||
        patient.email?.toLowerCase().includes(searchLower) ||
        patient.patient_id?.toLowerCase().includes(searchLower)
      );
    }

    // Apply age filter
    filtered = filtered.filter(patient => 
      patient.age >= filters.ageRange[0] && patient.age <= filters.ageRange[1]
    );

    // Apply gender filter
    if (filters.gender) {
      filtered = filtered.filter(patient => patient.gender === filters.gender);
    }

    // Apply visit frequency filter
    if (filters.visitFrequency) {
      filtered = filtered.filter(patient => patient.visit_frequency === filters.visitFrequency);
    }

    // Apply amount spent filter
    filtered = filtered.filter(patient => 
      patient.amount_spent >= filters.amountSpentRange[0] && 
      patient.amount_spent <= filters.amountSpentRange[1]
    );

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key as keyof EnhancedPatient];
      const bValue = b[sortConfig.key as keyof EnhancedPatient];
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [patients, filters, sortConfig]);

  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const handlePatientSelect = (patientId: string, selected: boolean) => {
    setSelectedPatients(prev => 
      selected 
        ? [...prev, patientId]
        : prev.filter(id => id !== patientId)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedPatients(selected ? processedPatients.map(p => p.id) : []);
  };

  const handlePatientClick = (patient: EnhancedPatient) => {
    setSelectedPatient(patient);
    setShowPatientModal(true);
  };

  const handlePatientSaved = () => {
    fetchPatientsWithAnalytics();
    setShowPatientModal(false);
    setSelectedPatient(null);
  };

  const handleNewPatient = () => {
    setSelectedPatient(null);
    setShowPatientModal(true);
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold">Patient Management</h1>
          <Badge variant="secondary" className="ml-2">
            {processedPatients.length} patients
          </Badge>
        </div>
        <Button onClick={handleNewPatient}>
          <Plus className="h-4 w-4 mr-2" />
          Add Patient
        </Button>
      </div>

      {/* Search and Controls */}
      <div className="flex items-center justify-between space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search patients by name, phone, or patient ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setFilters(prev => ({ ...prev, searchTerm: e.target.value }));
            }}
            className="pl-10"
          />
        </div>
        <PatientViewToggle 
          viewMode={viewMode} 
          onViewModeChange={setViewMode} 
        />
      </div>

      {/* Advanced Filters */}
      <AdvancedFilterPanel
        filters={filters}
        onFiltersChange={setFilters}
        patientCount={processedPatients.length}
        totalPatients={patients.length}
      />

      {/* Bulk Action Toolbar */}
      {selectedPatients.length > 0 && (
        <BulkActionToolbar
          selectedCount={selectedPatients.length}
          selectedPatients={selectedPatients}
          onAction={(action) => {
            toast.success(`${action} action triggered for ${selectedPatients.length} patients`);
          }}
        />
      )}

      {/* Patient Display */}
      {processedPatients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No patients found</h3>
            <p className="text-muted-foreground mb-4">
              {patients.length === 0 ? "Get started by adding your first patient." : "Try adjusting your filters."}
            </p>
            <Button onClick={handleNewPatient}>
              <Plus className="h-4 w-4 mr-2" />
              Add Patient
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {processedPatients.map((patient) => (
          <EnhancedPatientCard
            key={patient.id}
            patients={[patient]}
            selectedPatients={selectedPatients}
            onPatientSelect={handlePatientSelect}
            onPatientClick={handlePatientClick}
            onSelectAll={() => {}}
          />
          ))}
        </div>
      ) : (
        <PatientDataTable
          patients={processedPatients}
          selectedPatients={selectedPatients}
          onPatientSelect={handlePatientSelect}
          onSelectAll={handleSelectAll}
          onPatientClick={handlePatientClick}
          columns={columns}
          onColumnsChange={setColumns}
          sortConfig={sortConfig}
          onSort={handleSort}
        />
      )}

      {/* Patient Modal */}
      <UnifiedPatientModal
        open={showPatientModal}
        onOpenChange={setShowPatientModal}
        patient={selectedPatient}
        onSave={handlePatientSaved}
      />
    </div>
  );
}