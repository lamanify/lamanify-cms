import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Activity,
  AlertTriangle,
  Clock,
  UserCheck
} from 'lucide-react';

interface PatientStatsPanelProps {
  patients: any[];
}

export function PatientStatsPanel({ patients }: PatientStatsPanelProps) {
  const stats = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Calculate age for each patient
    const calculateAge = (dateOfBirth: string) => {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age;
    };

    // Basic counts
    const totalPatients = patients.length;
    const newPatients = patients.filter(p => 
      new Date(p.created_at) >= thirtyDaysAgo
    ).length;
    
    // Visit frequency analysis
    const newPatientsCount = patients.filter(p => (p.total_visits || 0) === 0).length;
    const regularPatientsCount = patients.filter(p => 
      (p.total_visits || 0) >= 3 && (p.total_visits || 0) < 10
    ).length;
    const frequentPatientsCount = patients.filter(p => (p.total_visits || 0) >= 10).length;
    const inactivePatientsCount = patients.filter(p => 
      p.last_visit_date && new Date(p.last_visit_date) < ninetyDaysAgo
    ).length;

    // Financial metrics
    const totalRevenue = patients.reduce((sum, p) => sum + (p.amount_spent || 0), 0);
    const averageSpentPerPatient = totalPatients > 0 ? totalRevenue / totalPatients : 0;
    
    // Demographics
    const genderDistribution = patients.reduce((acc, p) => {
      const gender = p.gender || 'unknown';
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const ageGroups = patients.reduce((acc, p) => {
      const age = calculateAge(p.date_of_birth);
      let group = '65+';
      if (age < 18) group = '0-17';
      else if (age < 35) group = '18-34';
      else if (age < 50) group = '35-49';
      else if (age < 65) group = '50-64';
      
      acc[group] = (acc[group] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Risk indicators
    const patientsWithAllergies = patients.filter(p => p.allergies).length;
    const overduePatientsCount = patients.filter(p => 
      p.last_visit_date && new Date(p.last_visit_date) < thirtyDaysAgo
    ).length;

    return {
      totalPatients,
      newPatients,
      newPatientsCount,
      regularPatientsCount,
      frequentPatientsCount,
      inactivePatientsCount,
      totalRevenue,
      averageSpentPerPatient,
      genderDistribution,
      ageGroups,
      patientsWithAllergies,
      overduePatientsCount
    };
  }, [patients]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
      {/* Total Patients */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalPatients}</div>
          <p className="text-xs text-muted-foreground">
            +{stats.newPatients} this month
          </p>
        </CardContent>
      </Card>

      {/* Revenue */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(stats.averageSpentPerPatient)} avg/patient
          </p>
        </CardContent>
      </Card>

      {/* Active Patients */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.totalPatients - stats.inactivePatientsCount}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.inactivePatientsCount} inactive
          </p>
        </CardContent>
      </Card>

      {/* Frequent Visitors */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Frequent Visitors</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.frequentPatientsCount}</div>
          <p className="text-xs text-muted-foreground">
            10+ visits each
          </p>
        </CardContent>
      </Card>

      {/* Overdue Follow-ups */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Follow-ups Due</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">
            {stats.overduePatientsCount}
          </div>
          <p className="text-xs text-muted-foreground">
            Need attention
          </p>
        </CardContent>
      </Card>

      {/* Risk Indicators */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">With Allergies</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {stats.patientsWithAllergies}
          </div>
          <p className="text-xs text-muted-foreground">
            Require caution
          </p>
        </CardContent>
      </Card>

      {/* Patient Distribution Card */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Patient Distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Visit Frequency</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <Badge variant="outline" className="text-xs">New</Badge>
                <span className="text-xs">{stats.newPatientsCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <Badge variant="outline" className="text-xs">Regular</Badge>
                <span className="text-xs">{stats.regularPatientsCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <Badge variant="outline" className="text-xs">Frequent</Badge>
                <span className="text-xs">{stats.frequentPatientsCount}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demographics Card */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Demographics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span>Gender Distribution</span>
            </div>
            <div className="space-y-1">
              {Object.entries(stats.genderDistribution).map(([gender, count]) => (
                <div key={gender} className="flex justify-between items-center">
                  <span className="text-xs capitalize">{gender}</span>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={(Number(count) / stats.totalPatients) * 100} 
                      className="w-16 h-2"
                    />
                    <span className="text-xs w-8 text-right">{String(count)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-2">
              <span>Age Groups</span>
            </div>
            <div className="space-y-1">
              {Object.entries(stats.ageGroups).map(([ageGroup, count]) => (
                <div key={ageGroup} className="flex justify-between items-center">
                  <span className="text-xs">{ageGroup}</span>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={(Number(count) / stats.totalPatients) * 100} 
                      className="w-16 h-2"
                    />
                    <span className="text-xs w-8 text-right">{String(count)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}