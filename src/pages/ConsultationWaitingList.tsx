import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useConsultation, WaitingPatient } from '@/hooks/useConsultation';
import { useAuth } from '@/hooks/useAuth';
import { Clock, User, AlertTriangle, Filter, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ConsultationWaitingList() {
  const [filter, setFilter] = useState<'all' | 'priority' | 'long-wait'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { waitingPatients, startConsultation, loading } = useConsultation();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const canStartConsultation = profile?.role === 'admin' || profile?.role === 'doctor';

  // Filter patients based on selected filter and search term
  const filteredPatients = waitingPatients.filter(patient => {
    const matchesSearch = !searchTerm || 
      `${patient.patient.first_name} ${patient.patient.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      patient.queue_number.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    const waitTime = Math.floor((Date.now() - new Date(patient.checked_in_at).getTime()) / (1000 * 60));
    
    switch (filter) {
      case 'priority':
        return patient.urgency_level === 'high' || patient.urgency_level === 'emergency';
      case 'long-wait':
        return waitTime > 45;
      default:
        return true;
    }
  });

  const getWaitTime = (checkedInAt: string) => {
    const waitMinutes = Math.floor((Date.now() - new Date(checkedInAt).getTime()) / (1000 * 60));
    if (waitMinutes < 60) return `${waitMinutes}m`;
    const hours = Math.floor(waitMinutes / 60);
    const minutes = waitMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const getWaitTimeColor = (checkedInAt: string) => {
    const waitMinutes = Math.floor((Date.now() - new Date(checkedInAt).getTime()) / (1000 * 60));
    if (waitMinutes >= 60) return 'text-queue-urgent';
    if (waitMinutes >= 30) return 'text-queue-waiting';
    return 'text-queue-new';
  };

  const getUrgencyColor = (urgencyLevel?: string) => {
    switch (urgencyLevel) {
      case 'emergency':
        return 'bg-queue-priority text-queue-priority-foreground';
      case 'high':
        return 'bg-queue-urgent text-destructive-foreground';
      case 'normal':
        return 'bg-queue-waiting text-warning-foreground';
      default:
        return 'bg-queue-new text-success-foreground';
    }
  };

  const handleStartConsultation = async (patient: WaitingPatient) => {
    try {
      const session = await startConsultation(
        patient.patient_id, 
        patient.id, 
        patient.urgency_level || 'normal'
      );
      if (session) {
        navigate(`/consultation/${session.id}`);
      }
    } catch (error) {
      console.error('Failed to start consultation:', error);
    }
  };

  if (!canStartConsultation) {
    return (
      <div className="space-y-6">
        <Card className="border-warning bg-warning/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              <p className="text-sm font-medium">
                Only doctors can access the consultation interface.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Patient Consultation</h1>
        <p className="text-muted-foreground">Manage patient consultations and clinical documentation</p>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Waiting List Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by patient name or queue number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter patients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Patients</SelectItem>
                  <SelectItem value="priority">Priority Patients</SelectItem>
                  <SelectItem value="long-wait">Long Wait Times</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Waiting Patients List */}
      <Card>
        <CardHeader>
          <CardTitle>Patients Waiting for Consultation ({filteredPatients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPatients.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No patients waiting</p>
              <p className="text-sm">Patients will appear here when they check in</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-6">
                    {/* Queue Number and Urgency */}
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary mb-1">
                        {patient.queue_number}
                      </div>
                      <Badge className={`text-xs ${getUrgencyColor(patient.urgency_level)}`}>
                        {patient.urgency_level || 'Normal'}
                      </Badge>
                    </div>

                    {/* Patient Info */}
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-lg">
                        {patient.patient.first_name} {patient.patient.last_name}
                      </div>
                      {patient.patient.visit_reason && (
                        <div className="text-sm text-muted-foreground">
                          Visit Reason: {patient.patient.visit_reason}
                        </div>
                      )}
                      {patient.patient.allergies && (
                        <div className="text-sm text-queue-urgent font-medium flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Allergies: {patient.patient.allergies}
                        </div>
                      )}
                    </div>

                    {/* Check-in Time and Wait Duration */}
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground mb-1">
                        Check-in: {new Date(patient.checked_in_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className={`text-sm font-medium flex items-center ${getWaitTimeColor(patient.checked_in_at)}`}>
                        <Clock className="h-3 w-3 mr-1" />
                        Wait: {getWaitTime(patient.checked_in_at)}
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div>
                    <Button
                      variant="priority"
                      onClick={() => handleStartConsultation(patient)}
                      disabled={loading}
                      className="font-medium"
                    >
                      Start Consultation
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}