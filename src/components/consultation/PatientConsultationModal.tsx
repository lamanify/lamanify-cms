import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useConsultationWorkflow } from '@/hooks/useConsultationWorkflow';
import { IntelligentPrescriptionModal } from './IntelligentPrescriptionModal';
import { useConsultationDrafts } from '@/hooks/useConsultationDrafts';
import { useQueueSessionSync } from '@/hooks/useQueueSessionSync';
import { 
  ArrowLeft, 
  Bell, 
  User, 
  Edit, 
  Clock, 
  Bold, 
  Italic, 
  Underline, 
  List, 
  Camera, 
  Save, 
  Calendar, 
  Upload, 
  Search, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  X,
  Plus,
  FileText
} from 'lucide-react';
import { QueueEntry } from '@/hooks/useQueue';

interface PatientConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  queueEntry: QueueEntry | null;
  onStartConsultation: (queueId: string) => void;
  onCallPatient: (queueId: string) => void;
  onMarkDone?: (consultationData: { notes: string; diagnosis: string; treatmentItems: any[] }) => void;
}

export function PatientConsultationModal({
  isOpen,
  onClose,
  queueEntry,
  onStartConsultation,
  onCallPatient,
  onMarkDone
}: PatientConsultationModalProps) {
  const [activeTab, setActiveTab] = useState('consultation');
  const [consultationNotes, setConsultationNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [historyTab, setHistoryTab] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all-time');
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [consultationStatus, setConsultationStatus] = useState<string>(queueEntry?.status || 'waiting');
  const { toast } = useToast();
  const { activeConsultationSession, startConsultationWorkflow, completeConsultationWorkflow, updateSessionDataRealtime } = useConsultationWorkflow();
  const { saveDraft, getDraftForPatient, deleteDraft, autoSaveStatus } = useConsultationDrafts();
  const { sessionData, refreshSessionData } = useQueueSessionSync(queueEntry?.id || null);
  
  // Sync consultation status with queue entry status
  useEffect(() => {
    if (queueEntry?.status) {
      setConsultationStatus(queueEntry.status);
    }
  }, [queueEntry?.status]);
  
  // Auto-save functionality with session updates
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const debouncedSave = useCallback(
    (formData: any, patientId: string) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(async () => {
        if (patientId) {
          // Save draft locally
          const draftId = await saveDraft(formData, patientId, currentDraftId);
          if (draftId && !currentDraftId) {
            setCurrentDraftId(draftId);
          }
          
          // Update queue session data in real-time
          if (queueEntry?.id) {
            await updateSessionDataRealtime(
              queueEntry.id,
              formData.consultationNotes || '',
              formData.diagnosis || '',
              formData.treatmentItems || []
            );
          }
        }
      }, 2000); // Auto-save after 2 seconds of inactivity
    },
    [saveDraft, currentDraftId, updateSessionDataRealtime, queueEntry?.id]
  );

  // Treatment items state
  const [treatmentItems, setTreatmentItems] = useState<Array<{
    id: string;
    item: string;
    quantity: number;
    priceTier: string;
    rate: number;
    amount: number;
    dosage: string;
    instruction: string;
    frequency: string;
    duration: string;
  }>>([]);
  
  // Reset form when modal opens/closes and load draft or session data
  useEffect(() => {
    if (isOpen && queueEntry?.patient?.id) {
      // Refresh session data on modal open
      refreshSessionData();
      
      // Load existing draft if available
      const existingDraft = getDraftForPatient(queueEntry.patient.id);
      if (existingDraft) {
        setConsultationNotes(existingDraft.draft_data.consultationNotes || '');
        setDiagnosis(existingDraft.draft_data.diagnosis || '');
        setTreatmentItems(existingDraft.draft_data.treatmentItems || []);
        setCurrentDraftId(existingDraft.id);
        setIsDraftSaved(true);
      } else {
        setIsDraftSaved(false);
        setConsultationNotes('');
        setDiagnosis('');
        setTreatmentItems([]);
        setCurrentDraftId(null);
      }
    } else if (!isOpen) {
      // Clean up timeout when modal closes
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    }
  }, [isOpen, queueEntry?.patient?.id, getDraftForPatient, refreshSessionData]);

  // Sync with real-time session data
  useEffect(() => {
    if (sessionData && isOpen) {
      console.log('Syncing consultation with session data:', sessionData);
      
      // Only update if session data is newer than current state
      if (sessionData.consultation_notes && sessionData.consultation_notes !== consultationNotes) {
        setConsultationNotes(sessionData.consultation_notes);
      }
      if (sessionData.diagnosis && sessionData.diagnosis !== diagnosis) {
        setDiagnosis(sessionData.diagnosis);
      }
      if (sessionData.prescribed_items && sessionData.prescribed_items.length > 0) {
        // Convert session data items back to treatment items format
        const convertedItems = sessionData.prescribed_items.map((item, index) => ({
          id: `session-${index}`,
          item: item.name,
          quantity: item.quantity,
          priceTier: 'standard', // Default tier
          rate: item.rate,
          amount: item.price,
          dosage: item.dosage || '',
          instruction: item.instructions || '',
          frequency: item.frequency || '',
          duration: item.duration || ''
        }));
        setTreatmentItems(convertedItems);
      }
    }
  }, [sessionData, isOpen, consultationNotes, diagnosis]);

  // Auto-save when form data changes
  useEffect(() => {
    if (isOpen && queueEntry?.patient?.id) {
      const formData = {
        consultationNotes,
        diagnosis,
        treatmentItems
      };
      
      debouncedSave(formData, queueEntry.patient.id);
    }
  }, [consultationNotes, diagnosis, treatmentItems, isOpen, queueEntry?.patient?.id, debouncedSave]);

  if (!queueEntry || !queueEntry.patient) return null;

  const patient = queueEntry.patient;
  const calculateAge = (dateOfBirth: string) => {
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getWaitTime = () => {
    const now = new Date();
    const checkedIn = new Date(queueEntry.checked_in_at);
    const diffMinutes = Math.floor((now.getTime() - checkedIn.getTime()) / (1000 * 60));
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours} hours ${minutes} mins`;
  };

  const addTreatmentItem = async (item: any) => {
    const newTreatmentItem = {
      ...item,
      amount: item.quantity * item.rate,
      id: item.id || `item-${Date.now()}`
    };
    
    setTreatmentItems(prev => {
      let updatedItems;
      if (item.id && prev.find(t => t.id === item.id)) {
        // Update existing item
        updatedItems = prev.map(t => t.id === item.id ? newTreatmentItem : t);
      } else {
        // Add new item
        updatedItems = [...prev, newTreatmentItem];
      }
      
      // Update session data with new treatment items
      if (queueEntry?.id) {
        updateSessionDataRealtime(
          queueEntry.id,
          consultationNotes,
          diagnosis,
          updatedItems
        );
      }
      
      return updatedItems;
    });
    
    setEditingItem(null);
    
    toast({
      title: "Success",
      description: item.id ? "Treatment item updated successfully" : "Treatment item added successfully",
    });
  };

  const editTreatmentItem = (item: any) => {
    setEditingItem(item);
    setIsPrescriptionModalOpen(true);
  };

  const removeTreatmentItem = async (id: string) => {
    setTreatmentItems(prev => {
      const updatedItems = prev.filter(item => item.id !== id);
      
      // Update session data with remaining treatment items
      if (queueEntry?.id) {
        updateSessionDataRealtime(
          queueEntry.id,
          consultationNotes,
          diagnosis,
          updatedItems
        );
      }
      
      return updatedItems;
    });
    
    toast({
      title: "Success",
      description: "Treatment item removed successfully",
    });
  };

  const getTotalAmount = () => {
    return treatmentItems.reduce((total, item) => total + item.amount, 0);
  };

  const saveConsultationNotes = async () => {
    if (!consultationNotes.trim() && !diagnosis && treatmentItems.length === 0) {
      toast({
        title: "Error",
        description: "Please enter consultation notes, diagnosis, or add treatment items",
        variant: "destructive",
      });
      return;
    }

    // Save as draft - no database operation needed, just local state
    setIsDraftSaved(true);
    
    // Update queue session data immediately
    if (queueEntry?.id) {
      await updateSessionDataRealtime(
        queueEntry.id,
        consultationNotes,
        diagnosis,
        treatmentItems
      );
    }
    
    toast({
      title: "Draft Saved",
      description: "Consultation notes saved as draft and synced to session",
    });
  };

  const handleAttachPhoto = () => {
    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        // Here you would typically upload the files
        console.log('Attaching photos:', files);
        toast({
          title: "Success",
          description: `${files.length} photo(s) attached`,
        });
      }
    };
    
    input.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
        <div className="flex flex-col h-[90vh]">
          {/* Compact Header Section */}
          <div className="flex items-center justify-between p-4 border-b bg-background">
            <div className="flex items-center space-x-6">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-3">
                    <h1 className="text-xl font-bold text-foreground">{patient.first_name} {patient.last_name}</h1>
                     <Badge 
                       variant={
                         consultationStatus === 'dispensary' ? 'default' :
                         consultationStatus === 'in_consultation' ? 'secondary' : 
                         'outline'
                       }
                       className={`text-xs ${
                         consultationStatus === 'dispensary' ? 'bg-orange-500 text-white' :
                         consultationStatus === 'in_consultation' ? 'bg-green-100 text-green-800' : 
                         consultationStatus === 'waiting' ? 'bg-yellow-100 text-yellow-800' : ''
                       }`}
                     >
                       {consultationStatus === 'dispensary' ? 'Dispensary' :
                        consultationStatus === 'waiting' ? 'Waiting' : 
                        consultationStatus === 'in_consultation' ? 'Serving' : 
                        consultationStatus.charAt(0).toUpperCase() + consultationStatus.slice(1)}
                     </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <div>
                      {patient.date_of_birth ? `${calculateAge(patient.date_of_birth)}` : 'Age unknown'},{patient.gender || 'Gender unknown'}
                    </div>
                    {patient.patient_id && (
                      <div className="font-mono text-[10px] text-muted-foreground mt-1">
                        ID: {patient.patient_id}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Patient Info Cards - Vertical Layout */}
              <div className="flex items-center space-x-3">
                <div className="bg-muted/50 rounded-lg px-3 py-2 text-center">
                  <div className="text-xs font-medium text-muted-foreground">Waiting</div>
                  <div className="text-xs">{getWaitTime()}</div>
                </div>
                <div className="bg-muted/50 rounded-lg px-3 py-2 text-center">
                  <div className="text-xs font-medium text-muted-foreground">Allergy:</div>
                  <div className="text-xs">{patient.allergies || 'None'}</div>
                </div>
                <div className="bg-primary/10 rounded-lg px-3 py-2 text-center">
                  <div className="text-xs font-medium text-primary">Payment:</div>
                  <div className="text-xs text-primary">
                    <div>{queueEntry.payment_method || 'Self-pay'}</div>
                    {queueEntry.payment_method_notes && (
                      <div className="text-xs text-muted-foreground opacity-75">
                        {queueEntry.payment_method_notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right side - Actions and Draft Status */}
            <div className="flex items-center space-x-3">
              {/* Draft Status Indicator */}
              {autoSaveStatus && (
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{autoSaveStatus}</span>
                </div>
              )}
              {currentDraftId && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  Draft
                </Badge>
              )}
              
              {/* Action Buttons */}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Main Content with Tabs */}
          <div className="flex-1 flex overflow-hidden">
            {/* Main Content with Tabs */}
            <div className="flex-1 flex flex-col">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="w-full justify-start rounded-none border-b bg-background">
                  <TabsTrigger value="consultation" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Consultation
                  </TabsTrigger>
                  <TabsTrigger value="treatment" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Treatment & Billing
                  </TabsTrigger>
                  <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Patient History
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="consultation" className="flex-1 p-4 space-y-4 overflow-y-auto m-0">
              {/* Waiting Status */}
              <div className="flex items-center mb-6">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-warning rounded-full animate-pulse"></div>
                  <span className="text-sm">Waiting: {getWaitTime()}</span>
                </div>
              </div>

                  {/* Consultation Notes */}
                  <div className="bg-primary text-primary-foreground p-3 rounded-t-lg">
                    <h3 className="font-medium text-sm">Write Consultation Notes here</h3>
                  </div>
                  <div className="border border-t-0 rounded-b-lg p-3">
                    <Textarea
                      placeholder="Type your consultation notes here"
                      value={consultationNotes}
                      onChange={(e) => setConsultationNotes(e.target.value)}
                      className="min-h-[100px] mb-3 resize-none text-sm"
                    />
                    
                    {/* Formatting Toolbar */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <Bold className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <Italic className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <Underline className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <List className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={handleAttachPhoto} className="h-7 text-xs">
                          <Camera className="h-3 w-3 mr-1" />
                          Attach photo
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={saveConsultationNotes}
                          variant={isDraftSaved ? "secondary" : "default"}
                          className="h-7 text-xs"
                        >
                          <Save className="h-3 w-3 mr-1" />
                          {isDraftSaved ? "Draft Saved" : "Save"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Diagnosis Section */}
                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="flex-1">
                        <label className="text-sm font-medium mb-1 block">Diagnosis</label>
                        <Select value={diagnosis} onValueChange={setDiagnosis}>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select diagnosis" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="common-cold">Common Cold</SelectItem>
                            <SelectItem value="flu">Influenza</SelectItem>
                            <SelectItem value="hypertension">Hypertension</SelectItem>
                            <SelectItem value="diabetes">Diabetes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex space-x-1">
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          Set appointment
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                          <Upload className="h-3 w-3 mr-1" />
                          Upload file
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="treatment" className="flex-1 p-4 space-y-4 overflow-y-auto m-0">
                  {/* Medicine/Services Header */}
                  <div>
                    <div className="bg-primary text-primary-foreground p-3 rounded-t-lg flex items-center justify-between">
                      <h3 className="font-medium text-sm">Insert your medicine, services and documents here</h3>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-white text-accent-foreground hover:bg-white/90"
                        onClick={() => {
                          setEditingItem(null);
                          setIsPrescriptionModalOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Item
                      </Button>
                    </div>
                    <div className="border border-t-0 rounded-b-lg p-4">
                      {/* Treatment Items List */}
                      {treatmentItems.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <p className="text-sm">No items added yet</p>
                          <p className="text-xs mt-1">Click "Add Item" to get started</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {treatmentItems.map((item, index) => (
                            <Card key={item.id} className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="font-medium text-sm">{item.item}</p>
                                    <p className="text-xs text-muted-foreground">
                                      Qty: {item.quantity} × RM {item.rate.toFixed(2)} = RM {item.amount.toFixed(2)}
                                    </p>
                                  </div>
                                  <div className="text-xs text-muted-foreground space-y-1">
                                    {item.dosage && <p><span className="font-medium">Dosage:</span> {item.dosage}</p>}
                                    {item.frequency && <p><span className="font-medium">Frequency:</span> {item.frequency}</p>}
                                    {item.duration && <p><span className="font-medium">Duration:</span> {item.duration}</p>}
                                    {item.instruction && <p><span className="font-medium">Instructions:</span> {item.instruction}</p>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => editTreatmentItem(item)}
                                    className="h-8 w-12 text-xs"
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeTreatmentItem(item.id)}
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                      
                      {/* Total */}
                      {treatmentItems.length > 0 && (
                        <div className="flex justify-end pt-4 border-t mt-4">
                          <div className="text-right">
                            <p className="text-sm font-semibold">Total: RM {getTotalAmount().toFixed(2)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="history" className="flex-1 p-4 space-y-4 overflow-y-auto m-0">
                  {/* Patient History Header */}
                  <div className="bg-primary text-primary-foreground p-3 rounded-t-lg">
                    <h3 className="font-medium text-sm">Patient History - Complete Medical Timeline</h3>
                  </div>
                  <div className="border border-t-0 rounded-b-lg p-4">
                    {/* History Sub-tabs */}
                    <div className="flex items-center justify-between mb-4">
                      <Tabs value={historyTab} onValueChange={setHistoryTab} className="w-full">
                        <div className="flex items-center justify-between">
                          <TabsList className="bg-muted">
                            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                            <TabsTrigger value="diagnosis" className="text-xs">Diagnosis</TabsTrigger>
                            <TabsTrigger value="medication" className="text-xs">Medication</TabsTrigger>
                            <TabsTrigger value="documents" className="text-xs">Documents</TabsTrigger>
                          </TabsList>
                          <div className="flex items-center space-x-2">
                            <Select value={timeFilter} onValueChange={setTimeFilter}>
                              <SelectTrigger className="h-8 w-32 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all-time">All time</SelectItem>
                                <SelectItem value="last-30-days">Last 30 days</SelectItem>
                                <SelectItem value="last-90-days">Last 90 days</SelectItem>
                                <SelectItem value="last-year">Last year</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                              <Search className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="mt-4 space-y-3">
                          {/* Patient Summary Cards */}
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <Card className="p-3">
                              <div className="text-center">
                                <div className="text-lg font-bold text-primary">
                                  {patient.medical_history ? '5' : '0'}
                                </div>
                                <div className="text-xs text-muted-foreground">Total Visits</div>
                              </div>
                            </Card>
                            <Card className="p-3">
                              <div className="text-center">
                                <div className="text-lg font-bold text-primary">
                                  {patient.date_of_birth ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() : 'N/A'}
                                </div>
                                <div className="text-xs text-muted-foreground">Age</div>
                              </div>
                            </Card>
                            <Card className="p-3">
                              <div className="text-center">
                                <div className="text-lg font-bold text-primary">15 Sep</div>
                                <div className="text-xs text-muted-foreground">Last Visit</div>
                              </div>
                            </Card>
                          </div>

                          {/* Timeline Content */}
                          <TabsContent value="all" className="mt-0">
                            <div className="space-y-3">
                              {/* Timeline Entry Example */}
                              <Card className="p-3 hover:bg-muted/50 cursor-pointer">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <Badge variant="outline" className="text-xs">Consultation</Badge>
                                      <span className="text-xs text-muted-foreground">19 Sep 2023</span>
                                    </div>
                                    <h4 className="text-sm font-medium">Regular Check-up</h4>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Diagnosis: {patient.medical_history || 'Routine examination, no issues found'}
                                    </p>
                                    <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                                      <span>Dr. Smith</span>
                                      <span>Duration: 30 mins</span>
                                    </div>
                                  </div>
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                </div>
                              </Card>

                              {/* No data message */}
                              <Card className="p-4 text-center border-dashed">
                                <p className="text-sm text-muted-foreground">No previous consultation records found</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  This will populate as consultations are completed
                                </p>
                              </Card>
                            </div>
                          </TabsContent>

                          <TabsContent value="diagnosis" className="mt-0">
                            <div className="space-y-3">
                              <Card className="p-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <Badge className="text-xs bg-blue-100 text-blue-800">Primary</Badge>
                                      <span className="text-xs text-muted-foreground">Current</span>
                                    </div>
                                    <h4 className="text-sm font-medium">
                                      {patient.medical_history || 'No previous diagnosis on record'}
                                    </h4>
                                  </div>
                                </div>
                              </Card>
                            </div>
                          </TabsContent>

                          <TabsContent value="medication" className="mt-0">
                            <div className="space-y-3">
                              <Card className="p-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <Badge variant="outline" className="text-xs">Current</Badge>
                                      <span className="text-xs text-muted-foreground">Active</span>
                                    </div>
                                    <h4 className="text-sm font-medium">Current Medications</h4>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {patient.allergies ? `Allergies: ${patient.allergies}` : 'No current medications on record'}
                                    </p>
                                  </div>
                                </div>
                              </Card>
                            </div>
                          </TabsContent>

                          <TabsContent value="documents" className="mt-0">
                            <div className="space-y-3">
                              <Card className="p-4 text-center border-dashed">
                                <p className="text-sm text-muted-foreground">No documents uploaded</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Medical reports, lab results, and images will appear here
                                </p>
                              </Card>
                            </div>
                          </TabsContent>
                        </div>
                      </Tabs>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="flex items-center justify-end space-x-3 p-4 border-t bg-background">
            <Button 
              variant="outline" 
              onClick={() => onCallPatient(queueEntry.id)}
              className="flex items-center space-x-2 h-9"
            >
              <span className="text-sm">Call patient in</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
            
            {consultationStatus === 'waiting' ? (
              <Button 
                onClick={async () => {
                  try {
                    await startConsultationWorkflow(patient.id, queueEntry.id);
                    // Update status via parent handler but don't close modal
                    onStartConsultation(queueEntry.id);
                    setConsultationStatus('in_consultation');
                    toast({
                      title: "Consultation Started",
                      description: "Patient status updated to Serving. You can continue with the consultation.",
                    });
                  } catch (error) {
                    console.error('Failed to start consultation:', error);
                    toast({
                      title: "Error",
                      description: "Failed to start consultation. Please try again.",
                      variant: "destructive"
                    });
                  }
                }}
                className="bg-primary hover:bg-primary/90 h-9 text-sm"
              >
                Start consultation
              </Button>
            ) : consultationStatus === 'dispensary' ? (
              <Button 
                onClick={async () => {
                  try {
                    await completeConsultationWorkflow(patient.id, queueEntry.id, {
                      notes: consultationNotes,
                      diagnosis: diagnosis,
                      treatmentItems: treatmentItems
                    });
                    
                    toast({
                      title: "Consultation Updated",
                      description: "Consultation notes and treatment have been updated.",
                    });
                  } catch (error) {
                    console.error('Failed to update consultation:', error);
                    toast({
                      title: "Error",
                      description: "Failed to update consultation. Please try again.",
                      variant: "destructive"
                    });
                  }
                }}
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10 h-9 text-sm"
              >
                Update Consultation
              </Button>
            ) : (
              <Button 
                onClick={async () => {
                  try {
                    await completeConsultationWorkflow(patient.id, queueEntry.id, {
                      notes: consultationNotes,
                      diagnosis: diagnosis,
                      treatmentItems: treatmentItems
                    });
                    
                    // Call onMarkDone to trigger status change to dispensary
                    await onMarkDone({
                      notes: consultationNotes,
                      diagnosis: diagnosis,
                      treatmentItems: treatmentItems
                    });
                    
                    // Update local status to dispensary
                    setConsultationStatus('dispensary');
                    
                    toast({
                      title: "Consultation Completed",
                      description: "Patient status changed to Dispensary. All data saved to medical history.",
                    });
                    
                    // Auto close modal and return to queue management
                    onClose();
                  } catch (error) {
                    console.error('Failed to complete consultation:', error);
                    toast({
                      title: "Error",
                      description: "Failed to complete consultation. Please try again.",
                      variant: "destructive"
                    });
                  }
                }}
                className="bg-primary hover:bg-primary/90 h-9 text-sm"
              >
                Consultation Completed
              </Button>
            )}
          </div>
        </div>
        </DialogContent>

        <IntelligentPrescriptionModal
          isOpen={isPrescriptionModalOpen}
          onClose={() => {
            setIsPrescriptionModalOpen(false);
            setEditingItem(null);
          }}
          onAdd={addTreatmentItem}
          editItem={editingItem}
          patientPriceTier={queueEntry?.patient?.assigned_tier_id}
        />
      </Dialog>
    );
}