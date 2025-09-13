import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useConsultation } from '@/hooks/useConsultation';
import { useAuth } from '@/hooks/useAuth';
import { PatientHeader } from '@/components/consultation/PatientHeader';
import { ClinicalDocumentationTab } from '@/components/consultation/ClinicalDocumentationTab';
import { TreatmentPlanTab } from '@/components/consultation/TreatmentPlanTab';
import { Pause, Play, Calendar, CheckCircle, Printer, AlertTriangle } from 'lucide-react';

export default function ConsultationInterface() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { 
    activeSession, 
    fetchConsultationDetails, 
    pauseConsultation, 
    resumeConsultation, 
    completeConsultation,
    loading 
  } = useConsultation();

  const [activeTab, setActiveTab] = useState('documentation');

  useEffect(() => {
    if (sessionId) {
      fetchConsultationDetails(sessionId);
    }
  }, [sessionId, fetchConsultationDetails]);

  const canAccessConsultation = profile?.role === 'admin' || profile?.role === 'doctor';

  if (!canAccessConsultation) {
    return (
      <Card className="border-warning bg-warning/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-warning">
            <AlertTriangle className="h-5 w-5" />
            <p>Only doctors can access consultation interfaces.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activeSession || loading) {
    return <div className="flex justify-center py-8">Loading consultation...</div>;
  }

  const handlePauseResume = () => {
    if (activeSession.status === 'active') {
      pauseConsultation(activeSession.id);
    } else if (activeSession.status === 'paused') {
      resumeConsultation(activeSession.id);
    }
  };

  const handleComplete = async () => {
    await completeConsultation(activeSession.id);
    navigate('/consultation-waiting');
  };

  return (
    <div className="space-y-6">
      {/* Patient Header */}
      <PatientHeader
        patient={activeSession.patient!}
        session={activeSession}
        queueNumber={activeSession.queue_id ? `Q${String(Math.floor(Math.random() * 999)).padStart(3, '0')}` : undefined}
      />

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center gap-4">
        <Button
          variant={activeSession.status === 'paused' ? 'default' : 'secondary'}
          onClick={handlePauseResume}
          disabled={loading}
        >
          {activeSession.status === 'paused' ? (
            <>
              <Play className="mr-2 h-4 w-4" />
              Resume Consultation
            </>
          ) : (
            <>
              <Pause className="mr-2 h-4 w-4" />
              Pause Consultation
            </>
          )}
        </Button>

        <Button variant="outline">
          <Calendar className="mr-2 h-4 w-4" />
          Schedule Follow-up
        </Button>

        <Button variant="outline">
          <Printer className="mr-2 h-4 w-4" />
          Print Summary
        </Button>

        <Button 
          variant="priority" 
          size="lg"
          onClick={handleComplete}
          disabled={loading}
        >
          <CheckCircle className="mr-2 h-5 w-5" />
          Complete Consultation
        </Button>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="documentation">Clinical Documentation</TabsTrigger>
          <TabsTrigger value="treatment">Treatment Plan</TabsTrigger>
          <TabsTrigger value="history">Patient History</TabsTrigger>
        </TabsList>

        <TabsContent value="documentation" className="mt-6">
          <ClinicalDocumentationTab
            sessionId={activeSession.id}
            patientId={activeSession.patient_id}
            initialData={activeSession.consultation_notes?.[0]}
          />
        </TabsContent>

        <TabsContent value="treatment" className="mt-6">
          <TreatmentPlanTab
            sessionId={activeSession.id}
            treatmentItems={activeSession.treatment_items}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-lg">Patient History</div>
                <p className="text-sm">Medical history and previous consultations will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}