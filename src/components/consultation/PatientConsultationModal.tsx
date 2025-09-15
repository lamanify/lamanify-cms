import React, { useState, useEffect } from 'react';
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
  X
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
  const { toast } = useToast();
  const { activeConsultationSession, startConsultationWorkflow, completeConsultationWorkflow } = useConsultationWorkflow();
  
  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setIsDraftSaved(false);
      setConsultationNotes('');
      setDiagnosis('');
      setTreatmentItems([]);
    }
  }, [isOpen]);
  
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
  
  const [newItem, setNewItem] = useState({
    item: '',
    quantity: 1,
    priceTier: 'Standard',
    rate: 0,
    dosage: '',
    instruction: '',
    frequency: '',
    duration: ''
  });

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

  const addTreatmentItem = () => {
    if (!newItem.item.trim()) return;
    
    const amount = newItem.quantity * newItem.rate;
    const item = {
      id: Date.now().toString(),
      ...newItem,
      amount
    };
    
    setTreatmentItems([...treatmentItems, item]);
    setNewItem({
      item: '',
      quantity: 1,
      priceTier: 'Standard',
      rate: 0,
      dosage: '',
      instruction: '',
      frequency: '',
      duration: ''
    });
  };

  const removeTreatmentItem = (id: string) => {
    setTreatmentItems(treatmentItems.filter(item => item.id !== id));
  };

  const getTotalAmount = () => {
    return treatmentItems.reduce((total, item) => total + item.amount, 0);
  };

  const saveConsultationNotes = () => {
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
    
    toast({
      title: "Draft Saved",
      description: "Consultation notes saved as draft",
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
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">{patient.first_name} {patient.last_name}</h1>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <span>
                      {patient.date_of_birth ? `${calculateAge(patient.date_of_birth)} years old` : 'Age unknown'}, {patient.gender || 'Gender unknown'}
                    </span>
                    {patient.patient_id && (
                      <span className="font-mono bg-muted px-1 py-0.5 rounded text-xs">
                        ID: {patient.patient_id}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-warning rounded-full animate-pulse"></div>
                <span className="text-xs text-muted-foreground">Waiting: {getWaitTime()}</span>
              </div>
              
              {/* Patient Info Cards - Moved from sidebar */}
              <div className="flex items-center space-x-3">
                <div className="bg-muted/50 rounded-lg px-3 py-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-muted-foreground">Allergy:</span>
                    <span className="text-xs">{patient.allergies || 'None'}</span>
                  </div>
                </div>
                <div className="bg-primary/10 rounded-lg px-3 py-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-primary">Payment:</span>
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
            </div>
            
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
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
                  {/* Medicine/Services Table */}
                  <div>
                    <div className="bg-primary text-primary-foreground p-3 rounded-t-lg">
                      <h3 className="font-medium text-sm">Insert your medicine, services and documents here</h3>
                    </div>
                    <div className="border border-t-0 rounded-b-lg">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="border-b">
                            <tr className="text-left">
                              <th className="p-2 text-xs font-medium">#</th>
                              <th className="p-2 text-xs font-medium">ITEM</th>
                              <th className="p-2 text-xs font-medium">QTY</th>
                              <th className="p-2 text-xs font-medium">PRICE TIER</th>
                              <th className="p-2 text-xs font-medium">RATE</th>
                              <th className="p-2 text-xs font-medium">AMOUNT</th>
                              <th className="p-2 text-xs font-medium">DOSAGE</th>
                              <th className="p-2 text-xs font-medium">INSTRUCTION</th>
                              <th className="p-2 text-xs font-medium">FREQUENCY</th>
                              <th className="p-2 text-xs font-medium">DURATION</th>
                              <th className="p-2 text-xs font-medium">ACTION</th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* Add Item Row - Always visible at the top */}
                            <tr className="bg-muted/20 border-b">
                              <td className="p-1 text-xs font-medium text-muted-foreground">+</td>
                              <td className="p-1">
                                <Input
                                  placeholder="Item name"
                                  value={newItem.item}
                                  onChange={(e) => setNewItem({...newItem, item: e.target.value})}
                                  className="h-7 border-0 bg-transparent focus:bg-white text-xs"
                                />
                              </td>
                              <td className="p-1">
                                <Input
                                  type="number"
                                  placeholder="1"
                                  value={newItem.quantity}
                                  onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 1})}
                                  className="h-7 border-0 bg-transparent focus:bg-white w-12 text-xs"
                                />
                              </td>
                              <td className="p-1">
                                <Select value={newItem.priceTier} onValueChange={(value) => setNewItem({...newItem, priceTier: value})}>
                                  <SelectTrigger className="h-7 border-0 bg-transparent focus:bg-white text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Standard">Standard</SelectItem>
                                    <SelectItem value="Premium">Premium</SelectItem>
                                    <SelectItem value="Discounted">Discounted</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="p-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={newItem.rate}
                                  onChange={(e) => setNewItem({...newItem, rate: parseFloat(e.target.value) || 0})}
                                  className="h-7 border-0 bg-transparent focus:bg-white w-16 text-xs"
                                />
                              </td>
                              <td className="p-1 text-xs font-medium">
                                RM {(newItem.quantity * newItem.rate).toFixed(2)}
                              </td>
                              <td className="p-1">
                                <Input
                                  placeholder="Dosage"
                                  value={newItem.dosage}
                                  onChange={(e) => setNewItem({...newItem, dosage: e.target.value})}
                                  className="h-7 border-0 bg-transparent focus:bg-white w-16 text-xs"
                                />
                              </td>
                              <td className="p-1">
                                <Input
                                  placeholder="Instruction"
                                  value={newItem.instruction}
                                  onChange={(e) => setNewItem({...newItem, instruction: e.target.value})}
                                  className="h-7 border-0 bg-transparent focus:bg-white w-20 text-xs"
                                />
                              </td>
                              <td className="p-1">
                                <Input
                                  placeholder="Frequency"
                                  value={newItem.frequency}
                                  onChange={(e) => setNewItem({...newItem, frequency: e.target.value})}
                                  className="h-7 border-0 bg-transparent focus:bg-white w-16 text-xs"
                                />
                              </td>
                              <td className="p-1">
                                <Input
                                  placeholder="Duration"
                                  value={newItem.duration}
                                  onChange={(e) => setNewItem({...newItem, duration: e.target.value})}
                                  className="h-7 border-0 bg-transparent focus:bg-white w-16 text-xs"
                                />
                              </td>
                              <td className="p-1">
                                <Button 
                                  size="sm" 
                                  onClick={addTreatmentItem}
                                  disabled={!newItem.item.trim()}
                                  className="h-7 w-12 text-xs"
                                >
                                  Add
                                </Button>
                              </td>
                            </tr>
                            
                            {/* Treatment Items */}
                            {treatmentItems.length === 0 ? (
                              <tr>
                                <td className="p-2 text-xs text-muted-foreground text-center" colSpan={11}>
                                  Add items using the form above
                                </td>
                              </tr>
                            ) : (
                              treatmentItems.map((item, index) => (
                                <tr key={item.id} className="border-b hover:bg-muted/10">
                                  <td className="p-2 text-xs">{index + 1}</td>
                                  <td className="p-2 text-xs font-medium">{item.item}</td>
                                  <td className="p-2 text-xs">{item.quantity}</td>
                                  <td className="p-2 text-xs">{item.priceTier}</td>
                                  <td className="p-2 text-xs">RM {item.rate.toFixed(2)}</td>
                                  <td className="p-2 text-xs font-medium">RM {item.amount.toFixed(2)}</td>
                                  <td className="p-2 text-xs">{item.dosage || '-'}</td>
                                  <td className="p-2 text-xs">{item.instruction || '-'}</td>
                                  <td className="p-2 text-xs">{item.frequency || '-'}</td>
                                  <td className="p-2 text-xs">{item.duration || '-'}</td>
                                  <td className="p-2 text-xs">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => removeTreatmentItem(item.id)}
                                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex justify-end p-3 border-t">
                        <div className="text-right">
                          <p className="text-sm font-semibold">Total RM {getTotalAmount().toFixed(2)}</p>
                        </div>
                      </div>
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
            
            {!activeConsultationSession ? (
              <Button 
                onClick={async () => {
                  try {
                    await startConsultationWorkflow(patient.id, queueEntry.id);
                    onStartConsultation(queueEntry.id);
                    toast({
                      title: "Consultation Started",
                      description: "You can now document the consultation",
                    });
                  } catch (error) {
                    console.error('Failed to start consultation:', error);
                  }
                }}
                className="bg-primary hover:bg-primary/90 h-9 text-sm"
              >
                Start consultation
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
                    
                    toast({
                      title: "Consultation Completed",
                      description: "All consultation data has been saved to patient's medical history",
                    });
                    
                    onClose();
                  } catch (error) {
                    console.error('Failed to complete consultation:', error);
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
    </Dialog>
  );
}