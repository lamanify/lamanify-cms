import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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

interface ConsultationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityId: string;
  patientId: string;
}

interface ConsultationDetails {
  id: string;
  title: string;
  content: string;
  activity_date: string;
  metadata: any;
  staff_member?: {
    first_name: string;
    last_name: string;
    role: string;
  };
  consultation_session?: {
    id: string;
    started_at: string;
    completed_at: string;
    total_duration_minutes: number;
  };
  treatment_items?: Array<{
    id: string;
    item_type: string;
    quantity: number;
    rate: number;
    total_amount: number;
    dosage_instructions?: string;
    frequency?: string;
    duration_days?: number;
    notes?: string;
  }>;
}

export function ConsultationDetailsModal({
  isOpen,
  onClose,
  activityId,
  patientId
}: ConsultationDetailsModalProps) {
  const [consultationDetails, setConsultationDetails] = useState<ConsultationDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && activityId) {
      fetchConsultationDetails();
    }
  }, [isOpen, activityId]);

  const fetchConsultationDetails = async () => {
    setLoading(true);
    try {
      // Fetch the main activity record
      const { data: activity, error: activityError } = await supabase
        .from('patient_activities')
        .select(`
          *,
          staff_member:staff_member_id(first_name, last_name, role)
        `)
        .eq('id', activityId)
        .single();

      if (activityError) throw activityError;

      // If this is a consultation activity, fetch related consultation session and treatment items
      let consultationSession = null;
      let treatmentItems = [];

      if (activity.activity_type === 'consultation' && activity.related_record_id) {
        // Fetch consultation session
        const { data: sessionData, error: sessionError } = await supabase
          .from('consultation_sessions')
          .select('*')
          .eq('id', activity.related_record_id)
          .single();

        if (!sessionError && sessionData) {
          consultationSession = sessionData;
        }

        // Fetch treatment items for this consultation
        const { data: treatmentData, error: treatmentError } = await supabase
          .from('treatment_items')
          .select('*')
          .eq('consultation_session_id', activity.related_record_id);

        if (!treatmentError && treatmentData) {
          treatmentItems = treatmentData;
        }
      }

      setConsultationDetails({
        ...activity,
        consultation_session: consultationSession,
        treatment_items: treatmentItems
      });
    } catch (error) {
      console.error('Error fetching consultation details:', error);
      toast({
        title: "Error",
        description: "Failed to load consultation details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // TODO: Implement PDF download
    toast({
      title: "Coming Soon",
      description: "PDF download will be available soon",
    });
  };

  const calculateTotalAmount = () => {
    if (!consultationDetails?.treatment_items) return 0;
    return consultationDetails.treatment_items.reduce((total, item) => total + item.total_amount, 0);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (!consultationDetails) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0">
        <div className="flex flex-col h-[90vh]">
          {/* Header */}
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <Stethoscope className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">
                    {consultationDetails.title}
                  </DialogTitle>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(consultationDetails.activity_date), 'PPP')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{format(new Date(consultationDetails.activity_date), 'p')}</span>
                    </div>
                    {consultationDetails.staff_member && (
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>
                          Dr. {consultationDetails.staff_member.first_name} {consultationDetails.staff_member.last_name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full">
              <TabsList className="w-full justify-start mx-6 mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="notes">Clinical Notes</TabsTrigger>
                <TabsTrigger value="treatment">Treatment & Medications</TabsTrigger>
                <TabsTrigger value="billing">Billing</TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1 px-6 pb-6">
                <TabsContent value="overview" className="mt-0 space-y-6">
                  {/* Session Summary */}
                  {consultationDetails.consultation_session && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <Clock className="h-5 w-5" />
                          <span>Session Summary</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <div className="text-xl font-bold text-primary">
                              {formatDuration(consultationDetails.consultation_session.total_duration_minutes || 0)}
                            </div>
                            <div className="text-xs text-muted-foreground">Duration</div>
                          </div>
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <div className="text-xl font-bold text-primary">
                              {format(new Date(consultationDetails.consultation_session.started_at), 'p')}
                            </div>
                            <div className="text-xs text-muted-foreground">Started</div>
                          </div>
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <div className="text-xl font-bold text-primary">
                              {consultationDetails.consultation_session.completed_at 
                                ? format(new Date(consultationDetails.consultation_session.completed_at), 'p')
                                : 'In Progress'
                              }
                            </div>
                            <div className="text-xs text-muted-foreground">Completed</div>
                          </div>
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <div className="text-xl font-bold text-primary">
                              RM {calculateTotalAmount().toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground">Total Amount</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Quick Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Chief Complaint</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">
                          {consultationDetails.metadata?.chief_complaint || 'Not specified'}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Diagnosis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">
                          {consultationDetails.metadata?.diagnosis || 'Pending diagnosis'}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="mt-0 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <FileText className="h-5 w-5" />
                        <span>Clinical Documentation</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Consultation Notes</h4>
                        <div className="bg-muted p-4 rounded-lg">
                          <p className="text-sm whitespace-pre-wrap">
                            {consultationDetails.content || 'No notes recorded'}
                          </p>
                        </div>
                      </div>

                      {consultationDetails.metadata?.symptoms && (
                        <div>
                          <h4 className="font-medium mb-2">Symptoms</h4>
                          <div className="bg-muted p-4 rounded-lg">
                            <p className="text-sm whitespace-pre-wrap">
                              {consultationDetails.metadata.symptoms}
                            </p>
                          </div>
                        </div>
                      )}

                      {consultationDetails.metadata?.examination_findings && (
                        <div>
                          <h4 className="font-medium mb-2">Examination Findings</h4>
                          <div className="bg-muted p-4 rounded-lg">
                            <p className="text-sm whitespace-pre-wrap">
                              {consultationDetails.metadata.examination_findings}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="treatment" className="mt-0 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Pill className="h-5 w-5" />
                        <span>Medications & Treatments</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {consultationDetails.treatment_items && consultationDetails.treatment_items.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="border-b">
                              <tr className="text-left">
                                <th className="py-2 font-medium">Item</th>
                                <th className="py-2 font-medium">Type</th>
                                <th className="py-2 font-medium">Dosage</th>
                                <th className="py-2 font-medium">Frequency</th>
                                <th className="py-2 font-medium">Duration</th>
                                <th className="py-2 font-medium">Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {consultationDetails.treatment_items.map((item) => (
                                <tr key={item.id} className="border-b">
                                  <td className="py-3">
                                    <div>
                                      <Badge className="mb-1" variant="outline">
                                        {item.item_type}
                                      </Badge>
                                      {item.notes && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                          {item.notes}
                                        </p>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3">{item.item_type}</td>
                                  <td className="py-3">{item.dosage_instructions || '-'}</td>
                                  <td className="py-3">{item.frequency || '-'}</td>
                                  <td className="py-3">{item.duration_days ? `${item.duration_days} days` : '-'}</td>
                                  <td className="py-3 font-medium">RM {item.total_amount.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No medications or treatments prescribed
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="billing" className="mt-0 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <CreditCard className="h-5 w-5" />
                        <span>Billing Information</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                          <span className="font-medium">Payment Method</span>
                          <span>{consultationDetails.metadata?.payment_method || 'Self-pay'}</span>
                        </div>
                        
                        <Separator />
                        
                        <div className="space-y-2">
                          {consultationDetails.treatment_items?.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span>{item.item_type} (Qty: {item.quantity})</span>
                              <span>RM {item.total_amount.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                        
                        <Separator />
                        
                        <div className="flex justify-between items-center text-lg font-bold">
                          <span>Total Amount</span>
                          <span>RM {calculateTotalAmount().toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}