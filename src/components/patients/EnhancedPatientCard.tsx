import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Activity, 
  DollarSign, 
  MoreVertical,
  AlertCircle,
  CheckCircle,
  Clock,
  Stethoscope
} from 'lucide-react';
import { format } from 'date-fns';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

interface EnhancedPatientCardProps {
  patients: any[];
  selectedPatients: string[];
  onPatientSelect: (patientId: string, selected: boolean) => void;
  onPatientClick: (patient: any) => void;
  onSelectAll: (selected: boolean) => void;
}

export function EnhancedPatientCard({
  patients,
  selectedPatients,
  onPatientSelect,
  onPatientClick,
  onSelectAll
}: EnhancedPatientCardProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

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

  const getStatusIcon = (statusIndicator: string) => {
    switch (statusIndicator) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'follow_up':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <User className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getVisitFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'frequent':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'regular':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'new':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const allSelected = selectedPatients.length === patients.length && patients.length > 0;

  return (
    <div className="space-y-4">
      {/* Bulk Selection Header */}
      {patients.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
          <Checkbox
            checked={allSelected}
            onCheckedChange={onSelectAll}
          />
          <span className="text-sm text-muted-foreground">
            Select all {patients.length} patients
          </span>
          {selectedPatients.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {selectedPatients.length} selected
            </Badge>
          )}
        </div>
      )}

      {/* Patient Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {patients.map((patient) => (
          <HoverCard key={patient.id} openDelay={300} closeDelay={100}>
            <HoverCardTrigger asChild>
              <Card 
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg h-full flex flex-col ${
                  selectedPatients.includes(patient.id) 
                    ? 'ring-2 ring-primary bg-primary/5' 
                    : 'hover:shadow-md'
                }`}
                onMouseEnter={() => setHoveredCard(patient.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => onPatientClick(patient)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="relative"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={selectedPatients.includes(patient.id)}
                          onCheckedChange={(checked) => onPatientSelect(patient.id, !!checked)}
                          className="absolute -top-1 -left-1 z-10"
                        />
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={patient.avatar_url} />
                          <AvatarFallback className="bg-primary/10">
                            {patient.first_name?.[0]}{patient.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm truncate">
                            {patient.first_name} {patient.last_name}
                          </h3>
                          {getStatusIcon(patient.status_indicator)}
                        </div>
                        {patient.preferred_name && (
                          <p className="text-xs text-muted-foreground">
                            "{patient.preferred_name}"
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {patient.patient_id && (
                            <Badge variant="outline" className="text-xs font-mono px-1">
                              {patient.patient_id}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {calculateAge(patient.date_of_birth)}y • {patient.gender}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onPatientClick(patient)}>
                          <User className="h-4 w-4 mr-2" />
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
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Contact Info */}
                  <div className="space-y-2">
                    {patient.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span className="truncate">{patient.phone}</span>
                      </div>
                    )}
                    {patient.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{patient.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Visit Info */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <Activity className="h-3 w-3 text-muted-foreground" />
                      <span>{patient.total_visits || 0} visits</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                      <span>${(patient.amount_spent || 0).toFixed(0)}</span>
                    </div>
                  </div>

                  {/* Last Visit */}
                  {patient.last_visit_date && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span className="truncate">
                        {format(new Date(patient.last_visit_date), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  )}

                  {/* Tags and Status */}
                  <div className="flex items-center justify-between gap-2">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getVisitFrequencyColor(patient.visit_frequency)}`}
                    >
                      {patient.visit_frequency || 'new'}
                    </Badge>
                    
                    {patient.price_tiers?.tier_name && (
                      <Badge variant="secondary" className="text-xs">
                        {patient.price_tiers.tier_name}
                      </Badge>
                    )}
                  </div>

                  {/* Allergies Warning */}
                  {patient.allergies && (
                    <div className="flex items-center gap-2 p-2 bg-red-50 rounded-md border border-red-200">
                      <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                      <span className="text-xs text-red-700 truncate">
                        Allergies: {patient.allergies}
                      </span>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Registered: {format(new Date(patient.created_at), 'MMM dd, yyyy')}
                  </div>
                </CardContent>
              </Card>
            </HoverCardTrigger>

            {/* Hover Card with Extended Info */}
            <HoverCardContent className="w-80" side="right" align="start">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={patient.avatar_url} />
                    <AvatarFallback>
                      {patient.first_name?.[0]}{patient.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold">
                      {patient.first_name} {patient.last_name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      ID: {patient.patient_id} • Age: {calculateAge(patient.date_of_birth)}
                    </p>
                  </div>
                </div>

                {patient.address && (
                  <div>
                    <h5 className="text-sm font-medium mb-1">Address</h5>
                    <p className="text-sm text-muted-foreground">{patient.address}</p>
                  </div>
                )}

                {patient.medical_history && (
                  <div>
                    <h5 className="text-sm font-medium mb-1">Medical History</h5>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {patient.medical_history}
                    </p>
                  </div>
                )}

                {patient.last_diagnosis && (
                  <div className="flex items-start gap-2">
                    <Stethoscope className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <h5 className="text-sm font-medium">Last Diagnosis</h5>
                      <p className="text-sm text-muted-foreground">
                        {patient.last_diagnosis}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-2 border-t text-center">
                  <div>
                    <div className="text-lg font-semibold">{patient.total_visits || 0}</div>
                    <div className="text-xs text-muted-foreground">Total Visits</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold">${(patient.amount_spent || 0).toFixed(0)}</div>
                    <div className="text-xs text-muted-foreground">Amount Spent</div>
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        ))}
      </div>

      {patients.length === 0 && (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-semibold text-muted-foreground">No patients found</p>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search criteria or add a new patient
          </p>
        </div>
      )}
    </div>
  );
}