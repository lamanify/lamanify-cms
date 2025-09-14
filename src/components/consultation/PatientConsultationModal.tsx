import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
}

export function PatientConsultationModal({
  isOpen,
  onClose,
  queueEntry,
  onStartConsultation,
  onCallPatient
}: PatientConsultationModalProps) {
  const [activeTab, setActiveTab] = useState('consultation');
  const [consultationNotes, setConsultationNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [historyTab, setHistoryTab] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all-time');
  
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden p-0">
        <div className="flex flex-col h-[95vh]">
          {/* Header Section */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={onClose}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold">{patient.first_name} {patient.last_name}</h2>
                  {patient.patient_id && (
                    <p className="text-sm text-muted-foreground font-mono">ID: {patient.patient_id}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {patient.date_of_birth ? `${calculateAge(patient.date_of_birth)} years old` : 'Age unknown'}, {patient.gender || 'Gender unknown'}
                  </p>
                  <div className="mt-2 p-2 bg-muted rounded-md border">
                    <p className="text-sm font-medium text-foreground">
                      <span className="font-bold">{patient.first_name} {patient.last_name}</span> | Queue: {queueEntry.queue_number} | ID: {patient.patient_id || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Top Navigation */}
            <div className="flex items-center space-x-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="appointment">Appointment</TabsTrigger>
                  <TabsTrigger value="consultation">Consultation</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel */}
            <div className="w-64 border-r p-4 space-y-4">
              {/* Allergy Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Allergy</CardTitle>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Edit className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {patient.allergies || 'No known allergies'}
                  </p>
                </CardContent>
              </Card>

              {/* Payment Card */}
              <Card className="bg-primary text-primary-foreground">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Payment</CardTitle>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground hover:text-primary-foreground/80">
                    <Edit className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Patient's Payment method</p>
                  <p className="text-sm font-semibold">Self-pay</p>
                </CardContent>
              </Card>
            </div>

            {/* Center Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {/* Waiting Status */}
              <div className="flex items-center mb-6">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-warning rounded-full animate-pulse"></div>
                  <span className="text-sm">Waiting: {getWaitTime()}</span>
                </div>
              </div>

              {/* Consultation Notes */}
              <div className="mb-6">
                <div className="bg-primary text-primary-foreground p-3 rounded-t-lg">
                  <h3 className="font-semibold">Write Consultation Notes here</h3>
                </div>
                <div className="border border-t-0 rounded-b-lg p-4">
                  <Textarea
                    placeholder="Type your consultation notes here"
                    value={consultationNotes}
                    onChange={(e) => setConsultationNotes(e.target.value)}
                    className="min-h-[120px] mb-4 resize-none"
                  />
                  
                  {/* Formatting Toolbar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Bold className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Italic className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Underline className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Camera className="h-4 w-4 mr-2" />
                        Attach photo
                      </Button>
                      <Button size="sm">
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Diagnosis Section */}
              <div className="mb-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Diagnosis</label>
                    <Select value={diagnosis} onValueChange={setDiagnosis}>
                      <SelectTrigger>
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
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Calendar className="h-4 w-4 mr-2" />
                      Set appointment
                    </Button>
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload file
                    </Button>
                  </div>
                </div>
              </div>

              {/* Medicine/Services Table */}
              <div className="mb-6">
                <div className="bg-primary text-primary-foreground p-3 rounded-t-lg">
                  <h3 className="font-semibold">Insert your medicine, services and documents here</h3>
                </div>
                <div className="border border-t-0 rounded-b-lg">
                  {/* Add Item Form */}
                  <div className="p-4 border-b bg-muted/20">
                    <div className="grid grid-cols-10 gap-2 text-xs">
                      <Input
                        placeholder="Item name"
                        value={newItem.item}
                        onChange={(e) => setNewItem({...newItem, item: e.target.value})}
                        className="h-8"
                      />
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={newItem.quantity}
                        onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 1})}
                        className="h-8"
                      />
                      <Select value={newItem.priceTier} onValueChange={(value) => setNewItem({...newItem, priceTier: value})}>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Standard">Standard</SelectItem>
                          <SelectItem value="Premium">Premium</SelectItem>
                          <SelectItem value="Discounted">Discounted</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Rate"
                        value={newItem.rate}
                        onChange={(e) => setNewItem({...newItem, rate: parseFloat(e.target.value) || 0})}
                        className="h-8"
                      />
                      <div className="h-8 flex items-center text-sm font-medium">
                        RM {(newItem.quantity * newItem.rate).toFixed(2)}
                      </div>
                      <Input
                        placeholder="Dosage"
                        value={newItem.dosage}
                        onChange={(e) => setNewItem({...newItem, dosage: e.target.value})}
                        className="h-8"
                      />
                      <Input
                        placeholder="Instruction"
                        value={newItem.instruction}
                        onChange={(e) => setNewItem({...newItem, instruction: e.target.value})}
                        className="h-8"
                      />
                      <Input
                        placeholder="Frequency"
                        value={newItem.frequency}
                        onChange={(e) => setNewItem({...newItem, frequency: e.target.value})}
                        className="h-8"
                      />
                      <Input
                        placeholder="Duration"
                        value={newItem.duration}
                        onChange={(e) => setNewItem({...newItem, duration: e.target.value})}
                        className="h-8"
                      />
                      <Button 
                        size="sm" 
                        onClick={addTreatmentItem}
                        disabled={!newItem.item.trim()}
                        className="h-8"
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b">
                        <tr className="text-left">
                          <th className="p-3 text-sm font-medium">#</th>
                          <th className="p-3 text-sm font-medium">ITEM</th>
                          <th className="p-3 text-sm font-medium">QTY</th>
                          <th className="p-3 text-sm font-medium">PRICE TIER</th>
                          <th className="p-3 text-sm font-medium">RATE</th>
                          <th className="p-3 text-sm font-medium">AMOUNT</th>
                          <th className="p-3 text-sm font-medium">DOSAGE</th>
                          <th className="p-3 text-sm font-medium">INSTRUCTION</th>
                          <th className="p-3 text-sm font-medium">FREQUENCY</th>
                          <th className="p-3 text-sm font-medium">DURATION</th>
                          <th className="p-3 text-sm font-medium">ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {treatmentItems.length === 0 ? (
                          <tr>
                            <td className="p-3 text-sm">1</td>
                            <td className="p-3 text-sm text-muted-foreground" colSpan={10}>
                              No items added yet
                            </td>
                          </tr>
                        ) : (
                          treatmentItems.map((item, index) => (
                            <tr key={item.id} className="border-b">
                              <td className="p-3 text-sm">{index + 1}</td>
                              <td className="p-3 text-sm font-medium">{item.item}</td>
                              <td className="p-3 text-sm">{item.quantity}</td>
                              <td className="p-3 text-sm">{item.priceTier}</td>
                              <td className="p-3 text-sm">RM {item.rate.toFixed(2)}</td>
                              <td className="p-3 text-sm font-medium">RM {item.amount.toFixed(2)}</td>
                              <td className="p-3 text-sm">{item.dosage || '-'}</td>
                              <td className="p-3 text-sm">{item.instruction || '-'}</td>
                              <td className="p-3 text-sm">{item.frequency || '-'}</td>
                              <td className="p-3 text-sm">{item.duration || '-'}</td>
                              <td className="p-3 text-sm">
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
                  <div className="flex justify-end p-4 border-t">
                    <div className="text-right">
                      <p className="text-sm font-semibold">Total RM {getTotalAmount().toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel - Patient History */}
            <div className="w-80 border-l">
              <div className="bg-primary text-primary-foreground p-4">
                <h3 className="font-semibold">Patient History</h3>
              </div>
              
              <div className="p-4">
                {/* History Tabs */}
                <Tabs value={historyTab} onValueChange={setHistoryTab} className="mb-4">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                    <TabsTrigger value="diagnosis" className="text-xs">Diagnosis</TabsTrigger>
                    <TabsTrigger value="medication" className="text-xs">Medication</TabsTrigger>
                    <TabsTrigger value="documents" className="text-xs">Documents</TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Time Filter */}
                <div className="mb-4">
                  <Select value={timeFilter} onValueChange={setTimeFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                      <ChevronDown className="h-4 w-4" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-time">All time</SelectItem>
                      <SelectItem value="last-month">Last month</SelectItem>
                      <SelectItem value="last-year">Last year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search..." className="pl-10" />
                </div>

                {/* Date Section */}
                <div className="mb-4">
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm font-medium">19 Sep 2023</span>
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <Button variant="ghost" size="icon" disabled>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">1/1</span>
                  <Button variant="ghost" size="icon" disabled>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t">
            <Button 
              variant="outline" 
              onClick={() => onCallPatient(queueEntry.id)}
              className="flex items-center space-x-2"
            >
              <span>Call patient in</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button 
              onClick={() => onStartConsultation(queueEntry.id)}
              className="bg-primary hover:bg-primary/90"
            >
              Start consultation
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}