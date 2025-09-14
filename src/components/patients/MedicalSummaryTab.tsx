import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { usePatientActivities } from '@/hooks/usePatientActivities';
import { AlertTriangle, Calendar, DollarSign, Heart, Pill, Plus } from 'lucide-react';
import { format } from 'date-fns';

interface MedicalSummaryTabProps {
  patientId: string;
  patient: {
    allergies?: string;
    medical_history?: string;
  };
}

export function MedicalSummaryTab({ patientId, patient }: MedicalSummaryTabProps) {
  const { medications, activities, loading } = usePatientActivities(patientId);

  // Get latest vital signs from activities
  const latestVitalSigns = activities
    .filter(a => a.activity_type === 'vital_signs')
    .sort((a, b) => new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime())[0];

  // Get upcoming appointments
  const upcomingAppointments = activities
    .filter(a => a.activity_type === 'appointment' && new Date(a.activity_date) > new Date())
    .sort((a, b) => new Date(a.activity_date).getTime() - new Date(b.activity_date).getTime())
    .slice(0, 3);

  // Get payment activities for outstanding balance
  const paymentActivities = activities.filter(a => a.activity_type === 'payment');
  const totalPaid = paymentActivities.reduce((sum, activity) => {
    return sum + (activity.metadata?.amount || 0);
  }, 0);

  // Get recent lab results
  const recentLabResults = activities
    .filter(a => a.activity_type === 'lab_results')
    .sort((a, b) => new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime())
    .slice(0, 3);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading medical summary...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Medications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold flex items-center">
              <Pill className="h-5 w-5 mr-2 text-blue-600" />
              Current Medications
            </CardTitle>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </CardHeader>
          <CardContent>
            {medications.length === 0 ? (
              <p className="text-muted-foreground text-sm">No current medications</p>
            ) : (
              <div className="space-y-3">
                {medications.map((medication) => (
                  <div key={medication.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{medication.medication_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {medication.dosage} • {medication.frequency}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Prescribed: {format(new Date(medication.prescribed_date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <Badge variant={medication.status === 'active' ? 'default' : 'secondary'}>
                        {medication.status}
                      </Badge>
                    </div>
                    {medication.refill_date && (
                      <p className="text-xs text-orange-600 mt-2">
                        Refill due: {format(new Date(medication.refill_date), 'MMM dd, yyyy')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Allergies & Chronic Conditions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
              Allergies & Conditions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Allergies</h4>
              {patient.allergies ? (
                <Badge variant="destructive" className="text-xs">
                  {patient.allergies}
                </Badge>
              ) : (
                <p className="text-muted-foreground text-sm">No known allergies</p>
              )}
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium text-sm mb-2">Medical History</h4>
              {patient.medical_history ? (
                <p className="text-sm text-muted-foreground">{patient.medical_history}</p>
              ) : (
                <p className="text-muted-foreground text-sm">No medical history recorded</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Latest Vital Signs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <Heart className="h-5 w-5 mr-2 text-red-500" />
              Latest Vital Signs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {latestVitalSigns ? (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  {format(new Date(latestVitalSigns.activity_date), 'MMM dd, yyyy h:mm a')}
                </div>
                {latestVitalSigns.metadata && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {latestVitalSigns.metadata.blood_pressure && (
                      <div>
                        <span className="font-medium">BP:</span> {latestVitalSigns.metadata.blood_pressure}
                      </div>
                    )}
                    {latestVitalSigns.metadata.temperature && (
                      <div>
                        <span className="font-medium">Temp:</span> {latestVitalSigns.metadata.temperature}°C
                      </div>
                    )}
                    {latestVitalSigns.metadata.weight && (
                      <div>
                        <span className="font-medium">Weight:</span> {latestVitalSigns.metadata.weight} kg
                      </div>
                    )}
                    {latestVitalSigns.metadata.heart_rate && (
                      <div>
                        <span className="font-medium">HR:</span> {latestVitalSigns.metadata.heart_rate} bpm
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No vital signs recorded</p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-purple-600" />
              Upcoming Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length === 0 ? (
              <p className="text-muted-foreground text-sm">No upcoming appointments</p>
            ) : (
              <div className="space-y-2">
                {upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="border rounded-lg p-3">
                    <div className="font-medium text-sm">{appointment.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(appointment.activity_date), 'MMM dd, yyyy h:mm a')}
                    </div>
                    {appointment.staff_member && (
                      <div className="text-xs text-muted-foreground">
                        with {appointment.staff_member.first_name} {appointment.staff_member.last_name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Lab Results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recent Lab Results</CardTitle>
        </CardHeader>
        <CardContent>
          {recentLabResults.length === 0 ? (
            <p className="text-muted-foreground text-sm">No lab results available</p>
          ) : (
            <div className="space-y-4">
              {recentLabResults.map((result) => (
                <div key={result.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{result.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(result.activity_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    {result.metadata?.abnormal && (
                      <Badge variant="destructive">Abnormal</Badge>
                    )}
                  </div>
                  {result.content && (
                    <p className="text-sm mt-2 text-muted-foreground">{result.content}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-green-600" />
            Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">RM {totalPaid.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Total Paid</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">RM 0.00</div>
              <div className="text-sm text-muted-foreground">Outstanding</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{paymentActivities.length}</div>
              <div className="text-sm text-muted-foreground">Transactions</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}