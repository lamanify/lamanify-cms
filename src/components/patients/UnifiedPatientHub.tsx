import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Patient } from '@/pages/Patients';
import { PatientViewToggle } from './PatientViewToggle';
import { AdvancedFilterPanel } from './AdvancedFilterPanel';
import { PatientDataTable } from './PatientDataTable';
import { EnhancedPatientCard } from './EnhancedPatientCard';
import { BulkActionToolbar } from './BulkActionToolbar';
import { UnifiedPatientModal } from './UnifiedPatientModal';
import { ExportManager } from './ExportManager';
import { PatientStatsPanel } from './PatientStatsPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Users, Search, Filter } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface EnhancedPatient extends Patient {
  last_visit_date?: string;
  last_diagnosis?: string;
  total_visits?: number;
  amount_spent?: number;
  visit_frequency?: 'new' | 'regular' | 'frequent' | 'inactive';
  status_indicator?: 'active' | 'overdue' | 'follow_up';
}

export interface FilterCriteria {
  search: string;
  ageRange: [number, number];
  gender: string[];
  registrationDate: { from?: string; to?: string };
  lastVisitDate: { from?: string; to?: string };
  diagnosis: string;
  tags: string[];
  tier: string[];
  paymentStatus: string[];
  visitFrequency: string[];
}

export interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  sortable: boolean;
  width?: number;
}

export const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: 'name', label: 'Patient Name', visible: true, sortable: true },
  { key: 'patient_id', label: 'ID', visible: true, sortable: true },
  { key: 'age', label: 'Age', visible: true, sortable: true },
  { key: 'phone', label: 'Phone', visible: true, sortable: false },
  { key: 'last_visit_date', label: 'Last Visit', visible: true, sortable: true },
  { key: 'last_diagnosis', label: 'Last Diagnosis', visible: false, sortable: false },
  { key: 'total_visits', label: 'Total Visits', visible: false, sortable: true },
  { key: 'amount_spent', label: 'Amount Spent', visible: false, sortable: true },
  { key: 'tier', label: 'Tier', visible: false, sortable: true },
  { key: 'created_at', label: 'Registration Date', visible: false, sortable: true }
];

export function UnifiedPatientHub() {
  const [patients, setPatients] = useState<EnhancedPatient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<EnhancedPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<EnhancedPatient | null>(null);
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  
  const [filters, setFilters] = useState<FilterCriteria>({
    search: '',
    ageRange: [0, 120],
    gender: [],
    registrationDate: {},
    lastVisitDate: {},
    diagnosis: '',
    tags: [],
    tier: [],
    paymentStatus: [],
    visitFrequency: []
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchPatientsWithAnalytics();
  }, []);

  const fetchPatientsWithAnalytics = async () => {
    setLoading(true);
    try {
      // Enhanced query with analytics data
      const { data, error } = await supabase
        .from('patients')
        .select(`
          *,
          patient_visits (
            id,
            visit_date,
            total_amount,
            visit_summary
          ),
          patient_queue (
            status,
            queue_date
          ),
          price_tiers (
            tier_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process and enhance patient data
      const enhancedPatients: EnhancedPatient[] = (data || []).map(patient => {
        const visits = patient.patient_visits || [];
        const lastVisit = visits.length > 0 ? visits.sort((a, b) => 
          new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime()
        )[0] : null;

        const totalSpent = visits.reduce((sum, visit) => sum + (visit.total_amount || 0), 0);
        const visitCount = visits.length;

        // Determine visit frequency
        let visitFrequency: 'new' | 'regular' | 'frequent' | 'inactive' = 'new';
        if (visitCount === 0) visitFrequency = 'new';
        else if (visitCount >= 10) visitFrequency = 'frequent';
        else if (visitCount >= 3) visitFrequency = 'regular';
        else if (lastVisit && new Date(lastVisit.visit_date) < new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)) {
          visitFrequency = 'inactive';
        }

        // Determine status indicator
        let statusIndicator: 'active' | 'overdue' | 'follow_up' = 'active';
        if (patient.patient_queue?.some((q: any) => q.status === 'waiting')) {
          statusIndicator = 'active';
        } else if (lastVisit && new Date(lastVisit.visit_date) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
          statusIndicator = 'follow_up';
        }

        return {
          ...patient,
          last_visit_date: lastVisit?.visit_date,
          last_diagnosis: lastVisit?.visit_summary?.split('.')[0] || 'No diagnosis recorded',
          total_visits: visitCount,
          amount_spent: totalSpent,
          visit_frequency: visitFrequency,
          status_indicator: statusIndicator
        };
      });

      setPatients(enhancedPatients);
      setFilteredPatients(enhancedPatients);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast({
        title: "Error",
        description: "Failed to fetch patients data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Apply filters and sorting
  const processedPatients = useMemo(() => {
    let result = [...filteredPatients];

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(patient =>
        `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchTerm) ||
        patient.patient_id?.toLowerCase().includes(searchTerm) ||
        patient.phone?.includes(searchTerm) ||
        patient.email?.toLowerCase().includes(searchTerm) ||
        patient.last_diagnosis?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply age filter
    result = result.filter(patient => {
      const age = calculateAge(patient.date_of_birth);
      return age >= filters.ageRange[0] && age <= filters.ageRange[1];
    });

    // Apply gender filter
    if (filters.gender.length > 0) {
      result = result.filter(patient => filters.gender.includes(patient.gender));
    }

    // Apply visit frequency filter
    if (filters.visitFrequency.length > 0) {
      result = result.filter(patient => filters.visitFrequency.includes(patient.visit_frequency || 'new'));
    }

    // Apply sorting
    if (sortConfig) {
      result.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof EnhancedPatient];
        let bValue: any = b[sortConfig.key as keyof EnhancedPatient];

        // Handle special cases
        if (sortConfig.key === 'name') {
          aValue = `${a.first_name} ${a.last_name}`;
          bValue = `${b.first_name} ${b.last_name}`;
        } else if (sortConfig.key === 'age') {
          aValue = calculateAge(a.date_of_birth);
          bValue = calculateAge(b.date_of_birth);
        }

        // Handle null values
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return sortConfig.direction === 'asc' ? 1 : -1;
        if (bValue == null) return sortConfig.direction === 'asc' ? -1 : 1;

        // Compare values
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        return sortConfig.direction === 'asc' 
          ? (aValue < bValue ? -1 : aValue > bValue ? 1 : 0)
          : (aValue > bValue ? -1 : aValue < bValue ? 1 : 0);
      });
    }

    return result;
  }, [filteredPatients, filters, sortConfig]);

  const calculateAge = (dateOfBirth: string) => {
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
    setIsModalOpen(true);
  };

  const handlePatientSaved = () => {
    fetchPatientsWithAnalytics();
    setIsModalOpen(false);
    setSelectedPatient(null);
  };

  const handleNewPatient = () => {
    setSelectedPatient(null);
    setIsModalOpen(true);
  };

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium">Loading patient data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Patient Management Hub</h1>
          <p className="text-muted-foreground">Comprehensive patient data management and analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportManager 
            patients={processedPatients} 
            selectedPatients={selectedPatients}
            columns={columns}
          />
          <Button onClick={handleNewPatient}>
            <Plus className="mr-2 h-4 w-4" />
            Add Patient
          </Button>
        </div>
      </div>

      {/* Stats Panel */}
      <PatientStatsPanel patients={patients} />

      <Separator />

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
          <PatientViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {processedPatients.length} of {patients.length} patients
          </span>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <AdvancedFilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              patients={patients}
            />
          </CardContent>
        </Card>
      )}

      {/* Bulk Actions */}
      {selectedPatients.length > 0 && (
        <BulkActionToolbar
          selectedCount={selectedPatients.length}
          selectedPatients={selectedPatients}
          onAction={(action) => {
            toast({
              title: "Bulk Action",
              description: `${action} applied to ${selectedPatients.length} patients`,
            });
            setSelectedPatients([]);
          }}
        />
      )}

      {/* Content */}
      {viewMode === 'card' ? (
        <EnhancedPatientCard
          patients={processedPatients}
          selectedPatients={selectedPatients}
          onPatientSelect={handlePatientSelect}
          onPatientClick={handlePatientClick}
          onSelectAll={handleSelectAll}
        />
      ) : (
        <PatientDataTable
          patients={processedPatients}
          selectedPatients={selectedPatients}
          onPatientSelect={handlePatientSelect}
          onPatientClick={handlePatientClick}
          onSelectAll={handleSelectAll}
          columns={columns}
          onColumnsChange={setColumns}
          sortConfig={sortConfig}
          onSort={handleSort}
        />
      )}

      {/* No Results */}
      {processedPatients.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold text-muted-foreground">
              {filters.search ? 'No patients found' : 'No patients registered'}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {filters.search ? 'Try adjusting your search criteria' : 'Start by adding your first patient'}
            </p>
            {!filters.search && (
              <Button onClick={handleNewPatient}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Patient
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Unified Modal */}
      <UnifiedPatientModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        patient={selectedPatient}
        onSave={handlePatientSaved}
      />
    </div>
  );
}