import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePatientActivities, PatientActivity } from '@/hooks/usePatientActivities';
import { VisitDetailsModal } from '@/components/patients/VisitDetailsModal';
import { Search, Filter, Download } from 'lucide-react';
import { format } from 'date-fns';

interface VisitingHistoryTabProps {
  patientId: string;
}

interface Visit {
  id: string;
  date: string;
  time: string;
  consultationNotes: string;
  medications: string[];
  diagnoses: string[];
  paymentMethod?: string;
  waitingTime?: number;
  activities: PatientActivity[];
}

export function ActivityHistoryTab({ patientId }: VisitingHistoryTabProps) {
  const {
    activities,
    loading,
    activityFilters,
    setActivityFilters
  } = usePatientActivities(patientId);

  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Group activities into visits based on consultation date
  const visits = useMemo(() => {
    const visitMap = new Map<string, Visit>();
    
    activities.forEach(activity => {
      const visitDate = format(new Date(activity.activity_date), 'yyyy-MM-dd');
      const existingVisit = visitMap.get(visitDate);
      
      if (existingVisit) {
        existingVisit.activities.push(activity);
        
        // Update visit details based on activity type
        if (activity.activity_type === 'consultation') {
          existingVisit.consultationNotes = activity.content || '';
          if (activity.metadata?.diagnosis) {
            const diagnosis = Array.isArray(activity.metadata.diagnosis) 
              ? activity.metadata.diagnosis 
              : [activity.metadata.diagnosis];
            existingVisit.diagnoses = [...new Set([...existingVisit.diagnoses, ...diagnosis])];
          }
        } else if (activity.activity_type === 'medication') {
          const medName = activity.metadata?.medication_name || activity.title.replace('Medication Prescribed: ', '');
          if (!existingVisit.medications.includes(medName)) {
            existingVisit.medications.push(medName);
          }
        }
      } else {
        const visit: Visit = {
          id: visitDate + '_' + activity.id,
          date: visitDate,
          time: format(new Date(activity.activity_date), 'h:mm a'),
          consultationNotes: activity.activity_type === 'consultation' ? (activity.content || '') : '',
          medications: activity.activity_type === 'medication' 
            ? [activity.metadata?.medication_name || activity.title.replace('Medication Prescribed: ', '')] 
            : [],
          diagnoses: activity.activity_type === 'consultation' && activity.metadata?.diagnosis
            ? Array.isArray(activity.metadata.diagnosis) 
              ? activity.metadata.diagnosis 
              : [activity.metadata.diagnosis]
            : [],
          paymentMethod: activity.metadata?.payment_method,
          waitingTime: activity.metadata?.waiting_time,
          activities: [activity]
        };
        visitMap.set(visitDate, visit);
      }
    });
    
    return Array.from(visitMap.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activities]);

  const filteredVisits = useMemo(() => {
    return visits.filter(visit => {
      if (activityFilters.search) {
        const searchLower = activityFilters.search.toLowerCase();
        return visit.consultationNotes.toLowerCase().includes(searchLower) ||
               visit.medications.some(med => med.toLowerCase().includes(searchLower)) ||
               visit.diagnoses.some(diag => diag.toLowerCase().includes(searchLower));
      }
      return true;
    });
  }, [visits, activityFilters.search]);

  const handleExportReport = () => {
    console.log('Exporting visiting history report...');
  };

  const handleVisitClick = (visit: Visit) => {
    setSelectedVisit(visit);
    setIsDetailsModalOpen(true);
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading visiting history...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Export */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search visits..."
            value={activityFilters.search}
            onChange={(e) => setActivityFilters({ ...activityFilters, search: e.target.value })}
            className="pl-10"
          />
        </div>

        <Button variant="outline" onClick={handleExportReport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Visiting History */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-3">
          {filteredVisits.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="text-muted-foreground">
                  {activityFilters.search
                    ? 'No visits found matching your search'
                    : 'No visits recorded yet'
                  }
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredVisits.map((visit) => (
              <Card 
                key={visit.id} 
                className="cursor-pointer transition-all duration-200 hover:bg-[#e9204f]/5 hover:border-[#e9204f]/20 hover:shadow-sm"
                onClick={() => handleVisitClick(visit)}
              >
                <CardContent className="p-4">
                  {/* Main visit date and time */}
                  <div className="text-lg font-bold text-foreground mb-2">
                    {format(new Date(visit.date), 'MMM dd, yyyy')} at {visit.time}
                  </div>
                  
                  {/* Summary line */}
                  <div className="text-sm text-foreground/80 mb-2">
                    {visit.consultationNotes && (
                      <span className="mr-4">
                        <strong>Notes:</strong> {truncateText(visit.consultationNotes, 90)}
                      </span>
                    )}
                    {visit.medications.length > 0 && (
                      <span className="mr-4">
                        <strong>Medicines:</strong> {visit.medications.join(', ')}
                      </span>
                    )}
                    {visit.diagnoses.length > 0 && (
                      <span>
                        <strong>Diagnosis:</strong> {visit.diagnoses.join(', ')}
                      </span>
                    )}
                  </div>
                  
                  {/* Minor info */}
                  <div className="text-xs text-muted-foreground">
                    {visit.paymentMethod && (
                      <span className="mr-4">Payment: {visit.paymentMethod}</span>
                    )}
                    {visit.waitingTime && (
                      <span>Wait time: {visit.waitingTime} minutes</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Visit Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-[#e9204f]">
                {visits.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Visits</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {visits.reduce((sum, visit) => sum + visit.medications.length, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Medications Prescribed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {visits.filter(visit => visit.diagnoses.length > 0).length}
              </div>
              <div className="text-sm text-muted-foreground">Visits with Diagnosis</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Visit Details Modal */}
      <VisitDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        visit={selectedVisit}
        patientId={patientId}
      />
    </div>
  );
}