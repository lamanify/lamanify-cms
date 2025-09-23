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
      // Fetch patient visits which contain consultation data in session_data
      const { data: visits, error: visitsError } = await supabase
        .from('patient_visits')
        .select(`
          id,
          visit_date,
          session_data,
          total_amount,
          payment_status,
          doctor_id
        `)
        .eq('patient_id', patient.id)
        .order('visit_date', { ascending: false });

      if (visitsError) throw visitsError;

      // Get unique doctor IDs for a separate query
      const doctorIds = [...new Set(visits?.map(visit => visit.doctor_id).filter(Boolean))];
      
      // Fetch doctor information separately
      const doctorProfiles = new Map();
      if (doctorIds.length > 0) {
        const { data: doctors } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', doctorIds);
          
        doctors?.forEach(doctor => {
          doctorProfiles.set(doctor.id, `Dr. ${doctor.first_name} ${doctor.last_name}`);
        });
      }

      // Transform visits into medical records by extracting data from session_data
      const records: MedicalRecord[] = [];

      visits?.forEach(visit => {
        const doctorName = doctorProfiles.get(visit.doctor_id) || 'Unknown Doctor';

        let diagnosis = '';
        let consultation_notes = '';
        let prescriptions: any[] = [];

        if (visit.session_data) {
          const sessionData = visit.session_data as any;
          console.log('Session data for visit:', visit.id, sessionData);
          diagnosis = sessionData?.diagnosis || '';
          consultation_notes = sessionData?.consultation_notes || '';
          prescriptions = sessionData?.prescribed_items || [];
        }

        // Only add records that have some consultation data
        if (consultation_notes || diagnosis || prescriptions.length > 0) {
          records.push({
            id: visit.id,
            visit_date: visit.visit_date,
            doctor_name: doctorName,
            diagnosis,
            consultation_notes,
            prescriptions,
            session_data: visit.session_data
          });
        }
      });

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

                        {/* Treatment Items */}
                        {record.prescriptions && record.prescriptions.length > 0 && (
                          <div className="mb-3">
                            <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                              <Pill className="h-4 w-4" />
                              Treatment Items ({record.prescriptions.length})
                            </h4>
                            <div className="space-y-2">
                              {record.prescriptions.map((item, idx) => (
                                <div key={idx} className="bg-muted p-2 rounded text-sm">
                                  <div className="flex items-center justify-between">
                                    <div className="font-medium">{item.name}</div>
                                    <Badge variant="secondary" className="text-xs">
                                      {item.type === 'medication' ? 'Medication' : 'Service'}
                                    </Badge>
                                  </div>
                                  
                                  {item.quantity && (
                                    <div className="text-muted-foreground">
                                      Quantity: {item.quantity}
                                    </div>
                                  )}
                                  
                                  {item.dosage && (
                                    <div className="text-muted-foreground">
                                      Dosage: {item.dosage}
                                    </div>
                                  )}
                                  
                                  {item.frequency && (
                                    <div className="text-muted-foreground">
                                      Frequency: {item.frequency}
                                    </div>
                                  )}
                                  
                                  {item.duration && (
                                    <div className="text-muted-foreground">
                                      Duration: {item.duration} {item.duration.includes('day') ? '' : 'days'}
                                    </div>
                                  )}
                                  
                                  {item.instructions && (
                                    <div className="text-muted-foreground">
                                      Instructions: {item.instructions}
                                    </div>
                                  )}
                                  
                                  {item.price && (
                                    <div className="text-muted-foreground font-medium">
                                      Amount: RM {item.price.toFixed(2)}
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