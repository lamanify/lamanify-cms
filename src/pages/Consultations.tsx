import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { ConsultationDialog } from '@/components/consultations/ConsultationDialog';
import { Plus, FileText, Calendar, User } from 'lucide-react';

export interface ConsultationNote {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  chief_complaint?: string;
  symptoms?: string;
  diagnosis?: string;
  treatment_plan?: string;
  prescriptions?: string;
  follow_up_instructions?: string;
  vital_signs?: any;
  created_at: string;
  patients: {
    first_name: string;
    last_name: string;
  };
  appointments: {
    appointment_date: string;
    appointment_time: string;
  };
  profiles: {
    first_name: string;
    last_name: string;
  };
}

export default function Consultations() {
  const [consultations, setConsultations] = useState<ConsultationNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationNote | null>(null);
  const { profile } = useAuth();
  const { toast } = useToast();

  const canCreateNotes = profile?.role === 'admin' || profile?.role === 'doctor';

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      const { data, error } = await supabase
        .from('consultation_notes')
        .select(`
          *,
          patients (first_name, last_name),
          appointments (appointment_date, appointment_time),
          profiles!consultation_notes_doctor_id_fkey (first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConsultations(data || []);
    } catch (error) {
      console.error('Error fetching consultations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch consultation notes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConsultationSaved = () => {
    fetchConsultations();
    setIsDialogOpen(false);
    setSelectedConsultation(null);
  };

  const handleEditConsultation = (consultation: ConsultationNote) => {
    setSelectedConsultation(consultation);
    setIsDialogOpen(true);
  };

  if (loading) {
    return <div>Loading consultation notes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Consultation Notes</h1>
          <p className="text-muted-foreground">Manage patient consultation records and medical notes</p>
        </div>
        {canCreateNotes && (
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Consultation Note
          </Button>
        )}
      </div>

      {!canCreateNotes && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-800">
              <FileText className="h-5 w-5" />
              <p className="text-sm font-medium">
                Only doctors and administrators can create consultation notes.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Consultation Notes List */}
      <div className="space-y-4">
        {consultations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold text-muted-foreground">No consultation notes</p>
              <p className="text-sm text-muted-foreground mb-4">
                Start by adding your first consultation note
              </p>
              {canCreateNotes && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Note
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          consultations.map((consultation) => (
            <Card 
              key={consultation.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleEditConsultation(consultation)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-semibold">
                      {consultation.patients?.first_name} {consultation.patients?.last_name}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Dr. {consultation.profiles?.first_name} {consultation.profiles?.last_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(consultation.appointments?.appointment_date || consultation.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {consultation.chief_complaint && (
                  <div>
                    <p className="text-sm font-medium">Chief Complaint:</p>
                    <p className="text-sm text-muted-foreground">{consultation.chief_complaint}</p>
                  </div>
                )}
                {consultation.diagnosis && (
                  <div>
                    <p className="text-sm font-medium">Diagnosis:</p>
                    <p className="text-sm text-muted-foreground">{consultation.diagnosis}</p>
                  </div>
                )}
                {consultation.treatment_plan && (
                  <div>
                    <p className="text-sm font-medium">Treatment Plan:</p>
                    <p className="text-sm text-muted-foreground">{consultation.treatment_plan}</p>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 text-xs text-muted-foreground border-t">
                  <span>Created: {new Date(consultation.created_at).toLocaleDateString()}</span>
                  {consultation.prescriptions && (
                    <Badge variant="outline">Has Prescriptions</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {canCreateNotes && (
        <ConsultationDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          consultation={selectedConsultation}
          onSave={handleConsultationSaved}
        />
      )}
    </div>
  );
}