import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

const mockData = [
  { month: 'Oct 21', inpatient: 250, patient: 450 },
  { month: 'Nov 21', inpatient: 300, patient: 520 },
  { month: 'Dec 21', inpatient: 280, patient: 380 },
  { month: 'Jan 21', inpatient: 450, patient: 480 },
  { month: 'Feb 21', inpatient: 200, patient: 250 },
  { month: 'Mar 21', inpatient: 350, patient: 420 },
  { month: 'Apr 21', inpatient: 180, patient: 320 },
  { month: 'May 21', inpatient: 220, patient: 280 },
  { month: 'Jun 21', inpatient: 280, patient: 350 },
];

export function PatientStatisticsChart() {
  return (
    <div className="bg-background rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Patient Statistics</h3>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-muted rounded"></div>
            <span className="text-sm text-muted-foreground">Inpatient</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded"></div>
            <span className="text-sm text-muted-foreground">Patient</span>
          </div>
          <select className="text-sm border border-input rounded px-2 py-1 bg-background">
            <option>Monthly</option>
          </select>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mockData} barCategoryGap="20%">
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              domain={[0, 600]}
              ticks={[0, 200, 400, 600]}
            />
            <Bar dataKey="inpatient" fill="hsl(var(--muted))" radius={[2, 2, 0, 0]} />
            <Bar dataKey="patient" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}