import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Stethoscope, Pill, FileText, Calendar, User } from 'lucide-react';
import { Patient } from '@/pages/Patients';

interface MedicalRecord {
  id: string;
  visit_date: string;
  doctor_name: string;
  diagnosis: string;
  consultation_notes: string;
  prescriptions: any[];
  session_data: any;
}

interface PatientMedicalTabProps {
  patient?: Patient | null;
  onSave: () => void;
}

export function PatientMedicalTab({ patient, onSave }: PatientMedicalTabProps) {
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [allergies, setAllergies] = useState<string>('');
  const [medicalHistory, setMedicalHistory] = useState<string>('');

  useEffect(() => {
    if (patient?.id) {
      fetchMedicalRecords();
      fetchPatientMedicalInfo();
    }
  }, [patient?.id]);

  // Set up real-time subscription for patient visits
  useEffect(() => {
    if (!patient?.id) return;

    const channel = supabase
      .channel('patient-medical-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'patient_visits',
          filter: `patient_id=eq.${patient.id}`
        },
        () => {
          console.log('Medical records updated, refreshing...');
          fetchMedicalRecords();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'consultation_notes',
          filter: `patient_id=eq.${patient.id}`
        },
        () => {
          console.log('Consultation notes updated, refreshing...');
          fetchMedicalRecords();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [patient?.id]);

  const fetchPatientMedicalInfo = async () => {
    if (!patient?.id) return;

    try {
      const { data } = await supabase
        .from('patients')
        .select('allergies, medical_history')
        .eq('id', patient.id)
        .single();

      if (data) {
        setAllergies(data.allergies || '');
        setMedicalHistory(data.medical_history || '');
      }
    } catch (error) {
      console.error('Error fetching patient medical info:', error);
    }
  };

  const fetchMedicalRecords = async () => {
    if (!patient?.id) return;

    setLoading(true);
    try {
      // First, fetch all consultation notes for this patient
      const { data: consultationNotes, error: notesError } = await supabase
        .from('consultation_notes')
        .select(`
          id,
          created_at,
          diagnosis,
          chief_complaint,
          symptoms,
          treatment_plan,
          prescriptions,
          vital_signs,
          doctor_id,
          profiles!consultation_notes_doctor_id_fkey(first_name, last_name)
        `)
        .eq('patient_id', patient.id)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;

      // Also fetch patient visits for additional context
      const { data: visits, error: visitsError } = await supabase
        .from('patient_visits')
        .select(`
          id,
          visit_date,
          session_data,
          total_amount,
          payment_status,
          doctor_id,
          profiles!patient_visits_doctor_id_fkey(first_name, last_name)
        `)
        .eq('patient_id', patient.id)
        .order('visit_date', { ascending: false });

      if (visitsError) throw visitsError;

      // Combine consultation notes and visits into medical records
      const records: MedicalRecord[] = [];

      // Add consultation notes as medical records
      consultationNotes?.forEach(note => {
        const doctorProfile = Array.isArray(note.profiles) ? note.profiles[0] : note.profiles;
        const doctorName = doctorProfile 
          ? `Dr. ${doctorProfile.first_name} ${doctorProfile.last_name}`
          : 'Unknown Doctor';

        records.push({
          id: note.id,
          visit_date: note.created_at,
          doctor_name: doctorName,
          diagnosis: note.diagnosis || '',
          consultation_notes: note.chief_complaint || note.symptoms || '',
          prescriptions: [], // Will be populated from session data if available
          session_data: null
        });
      });

      // Add visits that might not have consultation notes
      visits?.forEach(visit => {
        // Check if we already have a record for this visit from consultation notes
        const existingRecord = records.find(record => 
          new Date(record.visit_date).toDateString() === new Date(visit.visit_date).toDateString()
        );

        if (!existingRecord) {
          const doctorProfile = Array.isArray(visit.profiles) ? visit.profiles[0] : visit.profiles;
          const doctorName = doctorProfile 
            ? `Dr. ${doctorProfile.first_name} ${doctorProfile.last_name}`
            : 'Unknown Doctor';

          let diagnosis = '';
          let consultation_notes = '';
          let prescriptions: any[] = [];

          if (visit.session_data) {
            const sessionData = visit.session_data as any;
            diagnosis = sessionData?.diagnosis || '';
            consultation_notes = sessionData?.consultation_notes || '';
            prescriptions = sessionData?.prescribed_items || [];
          }

          records.push({
            id: visit.id,
            visit_date: visit.visit_date,
            doctor_name: doctorName,
            diagnosis,
            consultation_notes,
            prescriptions,
            session_data: visit.session_data
          });
        } else {
          // Enhance existing record with visit session data
          if (visit.session_data) {
            const sessionData = visit.session_data as any;
            if (sessionData?.prescribed_items) {
              existingRecord.prescriptions = sessionData.prescribed_items;
            }
            existingRecord.session_data = visit.session_data;
          }
        }
      });

      // Sort records by date (most recent first)
      records.sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());

      setMedicalRecords(records);
    } catch (error) {
      console.error('Error fetching medical records:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-muted-foreground">Loading medical records...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Patient Medical Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Allergies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {allergies || 'No known allergies recorded'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Medical History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {medicalHistory || 'No medical history recorded'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Medical Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Medical Records ({medicalRecords.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {medicalRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No medical records found</p>
              <p className="text-sm">Medical records will appear here after consultations are completed</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {medicalRecords.map((record, index) => (
                  <div key={record.id}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {format(new Date(record.visit_date), 'PPP')}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            Visit #{medicalRecords.length - index}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {record.doctor_name}
                          </span>
                        </div>

                        {/* Diagnosis */}
                        {record.diagnosis && (
                          <div className="mb-3">
                            <h4 className="text-sm font-medium mb-1">Diagnosis</h4>
                            <p className="text-sm bg-muted p-2 rounded">
                              {record.diagnosis}
                            </p>
                          </div>
                        )}

                        {/* Consultation Notes */}
                        {record.consultation_notes && (
                          <div className="mb-3">
                            <h4 className="text-sm font-medium mb-1">Consultation Notes</h4>
                            <p className="text-sm bg-muted p-2 rounded">
                              {record.consultation_notes}
                            </p>
                          </div>
                        )}

                        {/* Prescriptions */}
                        {record.prescriptions && record.prescriptions.length > 0 && (
                          <div className="mb-3">
                            <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                              <Pill className="h-4 w-4" />
                              Prescriptions ({record.prescriptions.length})
                            </h4>
                            <div className="space-y-2">
                              {record.prescriptions.map((prescription, idx) => (
                                <div key={idx} className="bg-muted p-2 rounded text-sm">
                                  <div className="font-medium">{prescription.name}</div>
                                  {prescription.dosage && (
                                    <div className="text-muted-foreground">
                                      Dosage: {prescription.dosage}
                                    </div>
                                  )}
                                  {prescription.instructions && (
                                    <div className="text-muted-foreground">
                                      Instructions: {prescription.instructions}
                                    </div>
                                  )}
                                  {prescription.quantity && (
                                    <div className="text-muted-foreground">
                                      Quantity: {prescription.quantity}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {index < medicalRecords.length - 1 && (
                      <Separator className="my-4" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}