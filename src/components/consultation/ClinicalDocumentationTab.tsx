import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save, Upload, FileText, Activity } from 'lucide-react';

interface VitalSigns {
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  heart_rate?: number;
  respiratory_rate?: number;
  oxygen_saturation?: number;
  [key: string]: number | undefined; // Add index signature for Json compatibility
}

interface ClinicalDocumentationTabProps {
  sessionId: string;
  patientId: string;
  initialData?: {
    chief_complaint?: string;
    symptoms?: string;
    diagnosis?: string;
    treatment_plan?: string;
    prescriptions?: string;
    follow_up_instructions?: string;
    vital_signs?: VitalSigns;
  };
  onSave?: () => void;
}

export function ClinicalDocumentationTab({ 
  sessionId, 
  patientId, 
  initialData, 
  onSave 
}: ClinicalDocumentationTabProps) {
  const [consultationData, setConsultationData] = useState({
    chief_complaint: initialData?.chief_complaint || '',
    symptoms: initialData?.symptoms || '',
    diagnosis: initialData?.diagnosis || '',
    treatment_plan: initialData?.treatment_plan || '',
    prescriptions: initialData?.prescriptions || '',
    follow_up_instructions: initialData?.follow_up_instructions || '',
  });

  const [vitalSigns, setVitalSigns] = useState<VitalSigns>(
    initialData?.vital_signs || {}
  );

  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { toast } = useToast();

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      handleSaveDraft();
    }, 30000);

    return () => clearInterval(interval);
  }, [consultationData, vitalSigns]);

  const handleInputChange = (field: string, value: string) => {
    setConsultationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleVitalSignChange = (field: keyof VitalSigns, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    setVitalSigns(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('consultation_notes')
        .upsert({
          patient_id: patientId,
          doctor_id: (await supabase.auth.getUser()).data.user?.id,
          appointment_id: sessionId, // Use sessionId as appointment_id for now
          ...consultationData,
          vital_signs: vitalSigns as any,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      setLastSaved(new Date());
      onSave?.();
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('consultation_notes')
        .upsert({
          patient_id: patientId,
          doctor_id: (await supabase.auth.getUser()).data.user?.id,
          appointment_id: sessionId, // Use sessionId as appointment_id for now
          ...consultationData,
          vital_signs: vitalSigns as any,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      setLastSaved(new Date());
      onSave?.();
      
      toast({
        title: "Consultation notes saved",
        description: "Clinical documentation has been saved successfully",
      });
    } catch (error) {
      console.error('Error saving consultation:', error);
      toast({
        title: "Error",
        description: "Failed to save consultation notes",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Save Status */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {saving && "Saving..."}
          {lastSaved && !saving && `Last saved: ${lastSaved.toLocaleTimeString()}`}
          {!lastSaved && !saving && "Draft not saved"}
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          Save Notes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clinical Notes */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Clinical Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="chief_complaint">Chief Complaint *</Label>
                <Textarea
                  id="chief_complaint"
                  placeholder="Patient's primary concern or reason for visit..."
                  value={consultationData.chief_complaint}
                  onChange={(e) => handleInputChange('chief_complaint', e.target.value)}
                  className="min-h-20"
                />
              </div>

              <div>
                <Label htmlFor="symptoms">Symptoms & History</Label>
                <Textarea
                  id="symptoms"
                  placeholder="Detailed symptoms, duration, associated factors..."
                  value={consultationData.symptoms}
                  onChange={(e) => handleInputChange('symptoms', e.target.value)}
                  className="min-h-24"
                />
              </div>

              <div>
                <Label htmlFor="diagnosis">Clinical Assessment & Diagnosis</Label>
                <Textarea
                  id="diagnosis"
                  placeholder="Clinical findings, differential diagnosis, final diagnosis..."
                  value={consultationData.diagnosis}
                  onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                  className="min-h-20"
                />
              </div>

              <div>
                <Label htmlFor="treatment_plan">Treatment Plan</Label>
                <Textarea
                  id="treatment_plan"
                  placeholder="Treatment approach, medications, procedures..."
                  value={consultationData.treatment_plan}
                  onChange={(e) => handleInputChange('treatment_plan', e.target.value)}
                  className="min-h-20"
                />
              </div>

              <div>
                <Label htmlFor="follow_up_instructions">Follow-up Instructions</Label>
                <Textarea
                  id="follow_up_instructions"
                  placeholder="Follow-up schedule, warning signs, lifestyle advice..."
                  value={consultationData.follow_up_instructions}
                  onChange={(e) => handleInputChange('follow_up_instructions', e.target.value)}
                  className="min-h-20"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vital Signs & Documents */}
        <div className="space-y-6">
          {/* Vital Signs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Vital Signs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bp_systolic">Blood Pressure</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="bp_systolic"
                      type="number"
                      placeholder="120"
                      value={vitalSigns.blood_pressure_systolic || ''}
                      onChange={(e) => handleVitalSignChange('blood_pressure_systolic', e.target.value)}
                    />
                    <span className="text-muted-foreground">/</span>
                    <Input
                      type="number"
                      placeholder="80"
                      value={vitalSigns.blood_pressure_diastolic || ''}
                      onChange={(e) => handleVitalSignChange('blood_pressure_diastolic', e.target.value)}
                    />
                    <span className="text-sm text-muted-foreground">mmHg</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="temperature">Temperature</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="temperature"
                      type="number"
                      step="0.1"
                      placeholder="98.6"
                      value={vitalSigns.temperature || ''}
                      onChange={(e) => handleVitalSignChange('temperature', e.target.value)}
                    />
                    <span className="text-sm text-muted-foreground">°F</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="heart_rate">Heart Rate</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="heart_rate"
                      type="number"
                      placeholder="72"
                      value={vitalSigns.heart_rate || ''}
                      onChange={(e) => handleVitalSignChange('heart_rate', e.target.value)}
                    />
                    <span className="text-sm text-muted-foreground">bpm</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="respiratory_rate">Resp. Rate</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="respiratory_rate"
                      type="number"
                      placeholder="16"
                      value={vitalSigns.respiratory_rate || ''}
                      onChange={(e) => handleVitalSignChange('respiratory_rate', e.target.value)}
                    />
                    <span className="text-sm text-muted-foreground">rpm</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="weight">Weight</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      placeholder="70.5"
                      value={vitalSigns.weight || ''}
                      onChange={(e) => handleVitalSignChange('weight', e.target.value)}
                    />
                    <span className="text-sm text-muted-foreground">kg</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="height">Height</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="height"
                      type="number"
                      placeholder="170"
                      value={vitalSigns.height || ''}
                      onChange={(e) => handleVitalSignChange('height', e.target.value)}
                    />
                    <span className="text-sm text-muted-foreground">cm</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Medical Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">
                  Drag and drop medical documents here
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports: PDF, JPG, PNG, DOCX (Max 10MB)
                </p>
                <Button variant="outline">
                  Choose Files
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}