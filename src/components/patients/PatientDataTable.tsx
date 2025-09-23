import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal, Settings, Eye, Phone, Mail, Calendar, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useCurrency } from '@/hooks/useCurrency';
import { WhatsAppTemplateModal } from './WhatsAppTemplateModal';
import type { Patient } from '@/pages/Patients';

interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  sortable: boolean;
}

interface PatientDataTableProps {
  patients: any[];
  selectedPatients: string[];
  onPatientSelect: (patientId: string, selected: boolean) => void;
  onPatientClick: (patient: any) => void;
  onSelectAll: (selected: boolean) => void;
  columns: ColumnConfig[];
  onColumnsChange: (columns: ColumnConfig[]) => void;
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
  onSort: (key: string) => void;
}

export function PatientDataTable({
  patients,
  selectedPatients,
  onPatientSelect,
  onPatientClick,
  onSelectAll,
  columns,
  onColumnsChange,
  sortConfig,
  onSort
}: PatientDataTableProps) {
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [whatsAppModal, setWhatsAppModal] = useState<{ isOpen: boolean; patient: Patient | null }>({
    isOpen: false,
    patient: null
  });
  const { formatCurrency } = useCurrency();

  const visibleColumns = columns.filter(col => col.visible);
  const allSelected = selectedPatients.length === patients.length && patients.length > 0;
  const someSelected = selectedPatients.length > 0 && selectedPatients.length < patients.length;

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

  const formatPhoneForWhatsApp = (phone: string) => {
    if (!phone) return '';
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    // If it starts with 0, replace with 60 (Malaysia country code)
    if (cleaned.startsWith('0')) {
      return '60' + cleaned.substring(1);
    }
    // If it already starts with 60, use as is
    if (cleaned.startsWith('60')) {
      return cleaned;
    }
    // Otherwise assume it needs 60 prefix
    return '60' + cleaned;
  };

  const renderSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-4 w-4" />
      : <ArrowDown className="h-4 w-4" />;
  };

  const renderCellContent = (patient: any, columnKey: string) => {
    switch (columnKey) {
      case 'name':
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={patient.avatar_url} />
              <AvatarFallback>
                {patient.first_name?.[0]}{patient.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">
                {patient.first_name} {patient.last_name}
              </div>
              {patient.preferred_name && (
                <div className="text-xs text-muted-foreground">
                  "{patient.preferred_name}"
                </div>
              )}
            </div>
          </div>
        );
      
      case 'patient_id':
        return (
          <Badge variant="outline" className="font-mono text-xs">
            {patient.patient_id || 'N/A'}
          </Badge>
        );
      
      case 'age':
        return (
          <div className="text-center">
            <div className="font-medium">{calculateAge(patient.date_of_birth)}</div>
            <div className="text-xs text-muted-foreground capitalize">{patient.gender}</div>
          </div>
        );
      
      case 'phone':
        return patient.phone ? (
          <div className="flex items-center gap-2">
            <Phone className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm">{patient.phone}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">No phone</span>
        );
      
      case 'last_visit_date':
        return patient.last_visit_date ? (
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm">
              {format(new Date(patient.last_visit_date), 'MMM dd, yyyy')}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">No visits</span>
        );
      
      case 'last_diagnosis':
        return patient.last_diagnosis ? (
          <div className="max-w-[200px] truncate text-sm" title={patient.last_diagnosis}>
            {patient.last_diagnosis}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">No diagnosis</span>
        );
      
      case 'total_visits':
        return (
          <div className="text-center">
            <Badge variant={patient.total_visits > 5 ? 'default' : 'secondary'}>
              {patient.total_visits || 0} visits
            </Badge>
          </div>
        );
      
      case 'amount_spent':
        return (
          <div className="text-right font-medium">
            {formatCurrency(patient.amount_spent || 0)}
          </div>
        );
      
      case 'tier':
        return patient.price_tiers?.tier_name ? (
          <Badge variant="outline">{patient.price_tiers.tier_name}</Badge>
        ) : (
          <span className="text-muted-foreground text-sm">No tier</span>
        );
      
      case 'created_at':
        return (
          <span className="text-sm">
            {format(new Date(patient.created_at), 'MMM dd, yyyy')}
          </span>
        );
      
      default:
        return patient[columnKey] || '-';
    }
  };

  const toggleColumn = (columnKey: string) => {
    const updatedColumns = columns.map(col =>
      col.key === columnKey ? { ...col, visible: !col.visible } : col
    );
    onColumnsChange(updatedColumns);
  };

  return (
    <div className="space-y-4">
      {/* Table Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {patients.length} patients
          </span>
          {selectedPatients.length > 0 && (
            <Badge variant="secondary">
              {selectedPatients.length} selected
            </Badge>
          )}
        </div>
        
        <DropdownMenu open={showColumnSettings} onOpenChange={setShowColumnSettings}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {columns.map((column) => (
              <DropdownMenuItem
                key={column.key}
                className="flex items-center space-x-2"
                onSelect={(e) => e.preventDefault()}
              >
                <Checkbox
                  checked={column.visible}
                  onCheckedChange={() => toggleColumn(column.key)}
                />
                <span>{column.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={onSelectAll}
                />
              </TableHead>
              {visibleColumns.map((column) => (
                <TableHead key={column.key} className="text-left">
                  {column.sortable ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 hover:bg-transparent"
                      onClick={() => onSort(column.key)}
                    >
                      <span className="mr-2">{column.label}</span>
                      {renderSortIcon(column.key)}
                    </Button>
                  ) : (
                    column.label
                  )}
                </TableHead>
              ))}
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.map((patient) => (
              <TableRow
                key={patient.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onPatientClick(patient)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedPatients.includes(patient.id)}
                    onCheckedChange={(checked) => onPatientSelect(patient.id, !!checked)}
                  />
                </TableCell>
                {visibleColumns.map((column) => (
                  <TableCell key={column.key}>
                    {renderCellContent(patient, column.key)}
                  </TableCell>
                ))}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onPatientClick(patient)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      {patient.phone && (
                        <DropdownMenuItem asChild>
                          <a href={`tel:${patient.phone}`}>
                            <Phone className="h-4 w-4 mr-2" />
                            Call Patient
                          </a>
                        </DropdownMenuItem>
                      )}
                      {patient.email && (
                        <DropdownMenuItem asChild>
                          <a href={`mailto:${patient.email}`}>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Email
                          </a>
                        </DropdownMenuItem>
                      )}
                      {patient.phone && (
                        <DropdownMenuItem 
                          onClick={() => setWhatsAppModal({ isOpen: true, patient })}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          WhatsApp Template
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {patients.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Eye className="h-12 w-12 mx-auto mb-4" />
          <p>No patients found matching your criteria</p>
        </div>
      )}

      {/* WhatsApp Template Modal */}
      {whatsAppModal.patient && (
        <WhatsAppTemplateModal
          isOpen={whatsAppModal.isOpen}
          onClose={() => setWhatsAppModal({ isOpen: false, patient: null })}
          patient={whatsAppModal.patient}
        />
      )}
    </div>
  );
}