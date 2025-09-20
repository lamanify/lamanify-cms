import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, RefreshCw, TrendingDown, TrendingUp, Users } from 'lucide-react';
import { usePatientReliability } from '@/hooks/usePatientReliability';

export const PatientReliabilityTracker: React.FC = () => {
  const { 
    reliabilityScores, 
    loading, 
    updateReliability, 
    getRiskLevelColor, 
    getRiskLevelText, 
    refetch 
  } = usePatientReliability();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading patient reliability data...</div>
        </CardContent>
      </Card>
    );
  }

  const highRiskPatients = reliabilityScores.filter(p => p.risk_level === 'high');
  const averageScore = reliabilityScores.length > 0 
    ? reliabilityScores.reduce((sum, p) => sum + p.reliability_score, 0) / reliabilityScores.length 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Patient Reliability Tracker</h2>
          <p className="text-muted-foreground">Monitor patient attendance patterns and reliability scores</p>
        </div>
        <Button onClick={refetch} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reliabilityScores.length}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Users className="h-3 w-3 mr-1" />
              With reliability data
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageScore.toFixed(1)}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1" />
              Clinic average
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">High Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{highRiskPatients.length}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Patients need attention
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Restricted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reliabilityScores.filter(p => p.restriction_active).length}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 mr-1" />
              Currently restricted
            </div>
          </CardContent>
        </Card>
      </div>

      {/* High Risk Patients Alert */}
      {highRiskPatients.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              High Risk Patients Requiring Attention
            </CardTitle>
            <CardDescription>
              These patients have low reliability scores and may need intervention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {highRiskPatients.slice(0, 5).map(patient => (
                <div key={patient.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">
                        {(patient as any).patients?.first_name} {(patient as any).patients?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {patient.no_shows} no-shows • {patient.late_cancellations} late cancellations
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium">{patient.reliability_score.toFixed(1)}%</p>
                      <Badge variant={getRiskLevelColor(patient.risk_level)}>
                        {getRiskLevelText(patient.risk_level)}
                      </Badge>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => updateReliability(patient.patient_id)}
                    >
                      Update
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Patients List */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Reliability Scores</CardTitle>
          <CardDescription>Complete list of patients with reliability tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reliabilityScores.map(patient => (
              <div key={patient.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="font-medium">
                      {(patient as any).patients?.first_name} {(patient as any).patients?.last_name}
                    </p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>{patient.total_appointments} total appointments</span>
                      <span>{patient.completed_appointments} completed</span>
                      <span className="text-destructive">{patient.no_shows} no-shows</span>
                      <span className="text-orange-600">{patient.late_cancellations} late cancellations</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right min-w-[120px]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{patient.reliability_score.toFixed(1)}%</span>
                      <Badge variant={getRiskLevelColor(patient.risk_level)}>
                        {getRiskLevelText(patient.risk_level)}
                      </Badge>
                    </div>
                    <Progress 
                      value={patient.reliability_score} 
                      className="w-20 h-2" 
                    />
                  </div>
                  
                  {patient.restriction_active && (
                    <Badge variant="destructive" className="min-w-fit">
                      Restricted
                    </Badge>
                  )}
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => updateReliability(patient.patient_id)}
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            
            {reliabilityScores.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No patient reliability data available</p>
                <p className="text-sm">Data will appear as patients have appointments</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};