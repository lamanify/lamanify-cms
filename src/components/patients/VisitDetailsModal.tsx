import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  X, 
  Calendar, 
  Clock, 
  User, 
  Stethoscope, 
  Pill, 
  CreditCard, 
  FileText, 
  Download,
  Printer
} from 'lucide-react';
import { format } from 'date-fns';

interface Visit {
  id: string;
  date: string;
  time: string;
  consultationNotes: string;
  medications: string[];
  diagnoses: string[];
  paymentMethod?: string;
  waitingTime?: number;
  activities: Array<{
    id: string;
    activity_type: string;
    title: string;
    content?: string;
    metadata?: any;
    staff_member?: {
      first_name: string;
      last_name: string;
      role: string;
    };
  }>;
}

interface VisitDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  visit: Visit | null;
  patientId: string;
}

export function VisitDetailsModal({
  isOpen,
  onClose,
  visit,
  patientId
}: VisitDetailsModalProps) {
  if (!visit) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    console.log('Download functionality to be implemented');
  };

  const getConsultationNotes = () => {
    if (!visit) return '';
    
    const consultationActivity = visit.activities.find(a => a.activity_type === 'consultation');
    if (!consultationActivity || !consultationActivity.content) return '';
    
    // Extract consultation notes from structured content
    const consultationNotesMatch = consultationActivity.content.match(/Consultation Notes:\s*([^]*?)(?:\n\n|$)/);
    if (consultationNotesMatch) {
      return consultationNotesMatch[1].trim();
    }
    
    // Try to extract notes from legacy format
    const notesMatch = consultationActivity.content.match(/Notes:\s*([^]*?)(?:\nPrescribed|$)/);
    if (notesMatch) {
      return notesMatch[1].trim();
    }
    
    // Check metadata for consultation notes
    if (consultationActivity.metadata?.consultation_notes) {
      return consultationActivity.metadata.consultation_notes;
    }
    
    // If no structured format found, extract meaningful consultation info
    if (consultationActivity.content.includes('Diagnosis:') || consultationActivity.content.includes('Notes:')) {
      // Extract everything before "Prescribed" or return processed content
      const beforePrescribed = consultationActivity.content.split(/(?:Prescribed \d+ items|Treatment Items Prescribed:)/)[0];
      return beforePrescribed.replace(/^(Diagnosis:[^\n]*\n?)/g, '').trim();
    }
    
    return consultationActivity.content;
  };

  const getMedicationDetails = () => {
    if (!visit) return [];
    
    const medicationMap = new Map();
    
    // Process medication activities
    visit.activities
      .filter(activity => activity.activity_type === 'medication')
      .forEach(activity => {
        const name = activity.metadata?.medication_name || activity.title.replace('Medication Prescribed: ', '').replace('Prescribed ', '');
        const cleanName = name.trim();
        
        if (!medicationMap.has(cleanName)) {
          medicationMap.set(cleanName, {
            name: cleanName,
            dosage: activity.metadata?.dosage || 'As directed',
            frequency: activity.metadata?.frequency || 'As needed',
            duration: activity.metadata?.duration || 'As prescribed',
            instructions: activity.metadata?.instructions || 'Follow as prescribed',
            cost: activity.metadata?.amount ? `RM ${activity.metadata.amount.toFixed(2)}` : 'N/A'
          });
        }
      });
    
    // Process treatment activities that are medications (exclude pure services)
    visit.activities
      .filter(activity => 
        activity.activity_type === 'treatment' && 
        activity.metadata?.service_name &&
        // Check if this treatment represents a medication by looking for dosage info or common medication patterns
        (activity.title.toLowerCase().includes('paracetamol') || 
         activity.title.toLowerCase().includes('medication') ||
         activity.title.toLowerCase().includes('tablet') ||
         activity.title.toLowerCase().includes('capsule') ||
         activity.title.toLowerCase().includes('syrup'))
      )
      .forEach(activity => {
        const serviceName = activity.metadata?.service_name || activity.title.replace('Treatment: ', '');
        const cleanName = serviceName.trim();
        
        // Only add if not already present from medication activities
        if (!medicationMap.has(cleanName)) {
          // Try to find corresponding medication activity for this treatment
          const correspondingMedActivity = visit.activities.find(medActivity => 
            medActivity.activity_type === 'medication' && 
            (medActivity.metadata?.medication_name?.toLowerCase().includes(serviceName.toLowerCase()) ||
             serviceName.toLowerCase().includes(medActivity.metadata?.medication_name?.toLowerCase() || ''))
          );
          
          if (correspondingMedActivity) {
            // Use details from the medication activity
            medicationMap.set(cleanName, {
              name: cleanName,
              dosage: correspondingMedActivity.metadata?.dosage || 'As directed',
              frequency: correspondingMedActivity.metadata?.frequency || 'As needed',
              duration: correspondingMedActivity.metadata?.duration || 'As prescribed',
              instructions: correspondingMedActivity.metadata?.instructions || 'Follow as prescribed',
              cost: activity.metadata?.amount ? `RM ${activity.metadata.amount.toFixed(2)}` : 'N/A'
            });
          } else {
            // Fallback for treatment-only entries
            medicationMap.set(cleanName, {
              name: cleanName,
              dosage: 'As directed',
              frequency: 'As needed',
              duration: 'As prescribed',
              instructions: 'Follow as prescribed',
              cost: activity.metadata?.amount ? `RM ${activity.metadata.amount.toFixed(2)}` : 'N/A'
            });
          }
        }
      });
    
    return Array.from(medicationMap.values());
  };

  const getStaffMember = () => {
    const consultationActivity = visit.activities.find(a => a.activity_type === 'consultation');
    return consultationActivity?.staff_member;
  };

  const medicationDetails = getMedicationDetails();
  const staffMember = getStaffMember();
  const totalCost = visit.activities.reduce((sum, activity) => 
    sum + (activity.metadata?.amount || 0), 0
  );

  const visitDateTime = new Date(`${visit.date}T${format(new Date(`2000-01-01 ${visit.time}`), 'HH:mm:ss')}`);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <DialogTitle className="text-xl font-semibold">
            Visit Details - {format(new Date(visit.date), 'MMM dd, yyyy')}
          </DialogTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-1">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="consultation">Consultation Notes</TabsTrigger>
              <TabsTrigger value="medications">Medications</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Visit Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center text-sm text-muted-foreground mb-1">
                        <Calendar className="h-4 w-4 mr-2" />
                        Date & Time
                      </div>
                      <div className="font-medium">
                        {format(visitDateTime, 'EEEE, MMM dd, yyyy')} at {visit.time}
                      </div>
                    </div>
                    
                    {staffMember && (
                      <div>
                        <div className="flex items-center text-sm text-muted-foreground mb-1">
                          <User className="h-4 w-4 mr-2" />
                          Staff Member
                        </div>
                        <div className="font-medium">
                          {staffMember.first_name} {staffMember.last_name}
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {staffMember.role}
                          </Badge>
                        </div>
                      </div>
                    )}
                    
                    {visit.waitingTime && (
                      <div>
                        <div className="flex items-center text-sm text-muted-foreground mb-1">
                          <Clock className="h-4 w-4 mr-2" />
                          Waiting Time
                        </div>
                        <div className="font-medium">{visit.waitingTime} minutes</div>
                      </div>
                    )}
                    
                    {visit.paymentMethod && (
                      <div>
                        <div className="flex items-center text-sm text-muted-foreground mb-1">
                          <CreditCard className="h-4 w-4 mr-2" />
                          Payment Method
                        </div>
                        <div className="font-medium">{visit.paymentMethod}</div>
                      </div>
                    )}
                  </div>

                  {visit.diagnoses.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <div className="flex items-center text-sm text-muted-foreground mb-2">
                          <Stethoscope className="h-4 w-4 mr-2" />
                          Diagnoses
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {visit.diagnoses.map((diagnosis, index) => (
                            <Badge key={index} variant="outline">
                              {diagnosis}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {visit.medications.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <div className="flex items-center text-sm text-muted-foreground mb-2">
                          <Pill className="h-4 w-4 mr-2" />
                          Medications Prescribed
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {visit.medications.map((medication, index) => (
                            <Badge key={index} variant="secondary">
                              {medication}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="consultation" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Consultation Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {getConsultationNotes() ? (
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {getConsultationNotes()}
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-sm">
                      No consultation notes recorded for this visit.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="medications" className="space-y-4">
              {medicationDetails.length > 0 ? (
                medicationDetails.map((medication, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Pill className="h-5 w-5 mr-2" />
                        {medication.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Dosage</div>
                          <div className="font-medium">{medication.dosage}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Frequency</div>
                          <div className="font-medium">{medication.frequency}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Duration</div>
                          <div className="font-medium">{medication.duration}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Cost</div>
                          <div className="font-medium">{medication.cost}</div>
                        </div>
                      </div>
                      {medication.instructions && (
                        <>
                          <Separator className="my-4" />
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">Instructions</div>
                            <div className="text-sm">{medication.instructions}</div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <div className="text-muted-foreground">
                      No medications prescribed during this visit.
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="billing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Billing Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Total Amount</div>
                      <div className="text-2xl font-bold text-[#e9204f]">
                        RM {totalCost.toFixed(2)}
                      </div>
                    </div>
                    {visit.paymentMethod && (
                      <div>
                        <div className="text-sm text-muted-foreground">Payment Method</div>
                        <div className="font-medium">{visit.paymentMethod}</div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div>
                    <div className="text-sm text-muted-foreground mb-3">Itemized Billing</div>
                    <div className="space-y-2">
                      {visit.activities
                        .filter(activity => activity.metadata?.amount)
                        .map((activity, index) => (
                          <div key={index} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                            <div>
                              <div className="font-medium">{activity.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {activity.activity_type === 'medication' 
                                  ? `${activity.metadata?.dosage || 'As directed'} - ${activity.metadata?.frequency || 'As needed'}`
                                  : activity.content?.substring(0, 50) + (activity.content?.length > 50 ? '...' : '')
                                }
                              </div>
                            </div>
                            <div className="font-medium">
                              RM {activity.metadata.amount.toFixed(2)}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}