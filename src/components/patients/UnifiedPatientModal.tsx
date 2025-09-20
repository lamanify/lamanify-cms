import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Patient } from '@/pages/Patients';
import { PatientBasicInfoTab } from './tabs/PatientBasicInfoTab';
import { PatientMedicalTab } from './tabs/PatientMedicalTab';
import { PatientFinancialTab } from './tabs/PatientFinancialTab';
import { PatientHistoryTab } from './tabs/PatientHistoryTab';
import { PatientTierSelector } from './PatientTierSelector';
import { 
  User, 
  FileText, 
  DollarSign, 
  History, 
  X, 
  Calendar,
  Phone,
  Mail
} from 'lucide-react';
import { format } from 'date-fns';

interface UnifiedPatientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient?: Patient | null;
  onSave: () => void;
}

export function UnifiedPatientModal({ open, onOpenChange, patient, onSave }: UnifiedPatientModalProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);

  // Calculate age
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

  const handleSave = () => {
    onSave();
  };

  const handleQuickAction = (action: string) => {
    console.log(`Quick action: ${action} for patient ${patient?.id}`);
    // Implement quick actions
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden p-0">
        <div className="flex flex-col h-[95vh]">
          {/* Enhanced Header */}
          <DialogHeader className="p-6 pb-4 border-b bg-gradient-to-r from-primary/5 to-secondary/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16 border-2 border-primary/20">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary/10 text-lg">
                    {patient ? `${patient.first_name?.[0]}${patient.last_name?.[0]}` : 'NP'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="space-y-2">
                  <DialogTitle className="text-2xl font-bold">
                    {patient ? 
                      `${patient.first_name} ${patient.last_name}` :
                      'Add New Patient'
                    }
                    {patient?.preferred_name && (
                      <span className="text-lg text-muted-foreground ml-2">
                        "{patient.preferred_name}"
                      </span>
                    )}
                  </DialogTitle>
                  
                  {patient && (
                    <div className="flex items-center space-x-4">
                      {patient.patient_id && (
                        <Badge variant="outline" className="text-base font-mono px-3 py-1">
                          ID: {patient.patient_id}
                        </Badge>
                      )}
                      <Badge variant="secondary">
                        {calculateAge(patient.date_of_birth)} years • {patient.gender}
                      </Badge>
                      <PatientTierSelector
                        patientId={patient.id}
                        currentTierId={patient.assigned_tier_id}
                        patientName={`${patient.first_name} ${patient.last_name}`}
                        onTierAssigned={onSave}
                      />
                    </div>
                  )}
                  
                  {patient && (
                    <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Registered: {format(new Date(patient.created_at || Date.now()), 'MMM dd, yyyy')}
                      </div>
                      {patient.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {patient.phone}
                        </div>
                      )}
                      {patient.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {patient.email}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions & Close */}
              <div className="flex items-center gap-2">
                {patient && (
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleQuickAction('schedule')}
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      Schedule
                    </Button>
                    {patient.phone && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        asChild
                      >
                        <a href={`tel:${patient.phone}`}>
                          <Phone className="h-4 w-4 mr-1" />
                          Call
                        </a>
                      </Button>
                    )}
                  </div>
                )}
                
                <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Tabbed Content */}
          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="px-6 pt-4 border-b">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Basic Info</span>
                  </TabsTrigger>
                  <TabsTrigger value="medical" className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Medical</span>
                  </TabsTrigger>
                  <TabsTrigger value="financial" className="flex items-center space-x-2" disabled={!patient}>
                    <DollarSign className="h-4 w-4" />
                    <span>Financial</span>
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex items-center space-x-2" disabled={!patient}>
                    <History className="h-4 w-4" />
                    <span>History</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-auto">
                <TabsContent value="basic" className="mt-0 h-full">
                  <PatientBasicInfoTab 
                    patient={patient} 
                    onSave={handleSave}
                    loading={loading}
                  />
                </TabsContent>
                
                <TabsContent value="medical" className="mt-0 h-full">
                  <PatientMedicalTab 
                    patient={patient}
                    onSave={handleSave}
                  />
                </TabsContent>
                
                <TabsContent value="financial" className="mt-0 h-full">
                  {patient && (
                    <PatientFinancialTab 
                      patient={patient}
                      onSave={handleSave}
                    />
                  )}
                </TabsContent>
                
                <TabsContent value="history" className="mt-0 h-full">
                  {patient && (
                    <PatientHistoryTab 
                      patient={patient}
                      onRefresh={onSave}
                    />
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}