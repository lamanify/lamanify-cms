import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePatientActivities, PatientActivity } from '@/hooks/usePatientActivities';
import { Search, Filter, Download, Eye, Printer } from 'lucide-react';
import { format } from 'date-fns';

interface ActivityHistoryTabProps {
  patientId: string;
}

export function ActivityHistoryTab({ patientId }: ActivityHistoryTabProps) {
  const {
    activities,
    loading,
    activityFilters,
    setActivityFilters,
    getFilteredActivities,
    getActivityTypeColor,
    getActivityIcon
  } = usePatientActivities(patientId);

  const filteredActivities = getFilteredActivities();
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);

  const handleExportReport = () => {
    // TODO: Implement export functionality
    console.log('Exporting activity report...');
  };

  const handleViewFullNotes = (activityId: string) => {
    // TODO: Implement full notes view
    console.log('Viewing full notes for:', activityId);
  };

  const handlePrintSummary = (activityId: string) => {
    // TODO: Implement print functionality
    console.log('Printing summary for:', activityId);
  };

  const formatActivityTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy h:mm a');
  };

  const getActivityTypeName = (type: string) => {
    switch (type) {
      case 'consultation':
        return 'Consultation';
      case 'medication':
        return 'Medication';
      case 'payment':
        return 'Payment';
      case 'communication':
        return 'Communication';
      case 'appointment':
        return 'Appointment';
      case 'vital_signs':
        return 'Vital Signs';
      case 'lab_results':
        return 'Lab Results';
      case 'system_note':
        return 'System Note';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading activity history...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search activities..."
            value={activityFilters.search}
            onChange={(e) => setActivityFilters({ ...activityFilters, search: e.target.value })}
            className="pl-10"
          />
        </div>
        
        <Select
          value={activityFilters.type}
          onValueChange={(value) => setActivityFilters({ ...activityFilters, type: value })}
        >
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Activities</SelectItem>
            <SelectItem value="consultation">Consultations</SelectItem>
            <SelectItem value="medication">Medications</SelectItem>
            <SelectItem value="payment">Payments</SelectItem>
            <SelectItem value="communication">Communications</SelectItem>
            <SelectItem value="appointment">Appointments</SelectItem>
            <SelectItem value="vital_signs">Vital Signs</SelectItem>
            <SelectItem value="lab_results">Lab Results</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={activityFilters.dateRange}
          onValueChange={(value) => setActivityFilters({ ...activityFilters, dateRange: value })}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-time">All Time</SelectItem>
            <SelectItem value="7-days">Last 7 Days</SelectItem>
            <SelectItem value="30-days">Last 30 Days</SelectItem>
            <SelectItem value="3-months">Last 3 Months</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={handleExportReport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Activity Timeline */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-4">
          {filteredActivities.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="text-muted-foreground">
                  {activityFilters.search || activityFilters.type !== 'all' || activityFilters.dateRange !== 'all-time'
                    ? 'No activities found matching your filters'
                    : 'No activities recorded yet'
                  }
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredActivities.map((activity) => (
              <Card key={activity.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">
                        {getActivityIcon(activity.activity_type)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getActivityTypeColor(activity.activity_type)}>
                            {getActivityTypeName(activity.activity_type)}
                          </Badge>
                          {activity.priority !== 'normal' && (
                            <Badge variant={activity.priority === 'urgent' ? 'destructive' : 'secondary'}>
                              {activity.priority.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-lg mt-1">{activity.title}</h3>
                        <div className="text-sm text-muted-foreground">
                          {formatActivityTime(activity.activity_date)}
                          {activity.staff_member && (
                            <span className="ml-2">
                              • {activity.staff_member.first_name} {activity.staff_member.last_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewFullNotes(activity.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePrintSummary(activity.id)}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {activity.content && (
                  <>
                    <Separator />
                    <CardContent className="pt-4">
                      <div className="text-sm">
                        {expandedActivity === activity.id ? (
                          <div className="space-y-2">
                            <p className="whitespace-pre-wrap">{activity.content}</p>
                            {activity.metadata && (
                              <div className="bg-muted p-3 rounded-md">
                                <h4 className="font-medium mb-2">Additional Details:</h4>
                                <pre className="text-xs overflow-auto">
                                  {JSON.stringify(activity.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedActivity(null)}
                            >
                              Show Less
                            </Button>
                          </div>
                        ) : (
                          <div>
                            <p className="truncate max-w-full">{activity.content}</p>
                            {activity.content.length > 150 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-2 p-0 h-auto text-primary"
                                onClick={() => setExpandedActivity(activity.id)}
                              >
                                Show More
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </>
                )}
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Activity Summary */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold">Activity Summary</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#e9204f]">
                {activities.filter(a => a.activity_type === 'consultation').length}
              </div>
              <div className="text-sm text-muted-foreground">Consultations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {activities.filter(a => a.activity_type === 'medication').length}
              </div>
              <div className="text-sm text-muted-foreground">Medications</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {activities.filter(a => a.activity_type === 'payment').length}
              </div>
              <div className="text-sm text-muted-foreground">Payments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {activities.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Activities</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}