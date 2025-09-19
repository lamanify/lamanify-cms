import { Users, FileText, Calendar, TrendingUp } from 'lucide-react';

interface SummaryCardsProps {
  totalPatients: number;
  totalDiagnoses: number;
  appointmentsScheduled: number;
  overallVisitors: number;
}

export function SummaryCards({ 
  totalPatients, 
  totalDiagnoses, 
  appointmentsScheduled, 
  overallVisitors 
}: SummaryCardsProps) {
  const cards = [
    {
      title: 'Total Patients',
      value: totalPatients.toLocaleString(),
      change: '+4.6%',
      changeLabel: 'From the last week',
      icon: Users,
      changeType: 'positive' as const
    },
    {
      title: 'Total Diagnoses',
      value: totalDiagnoses.toLocaleString(),
      change: '+4.5%',
      changeLabel: 'Diabetes diagnosed',
      icon: FileText,
      changeType: 'positive' as const
    },
    {
      title: 'Appointments Scheduled',
      value: appointmentsScheduled.toLocaleString(),
      change: '-11.6%',
      changeLabel: 'Attended appointments',
      icon: Calendar,
      changeType: 'negative' as const
    },
    {
      title: 'Overall visitors',
      value: overallVisitors.toLocaleString(),
      change: '+52%',
      changeLabel: 'Last 6 months',
      icon: TrendingUp,
      changeType: 'positive' as const
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div key={index} className="bg-background rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">{card.title}</h3>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            
            <div className="space-y-2">
              <div className="text-3xl font-bold">{card.value}</div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${
                  card.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {card.change}
                </span>
                <span className="text-xs text-muted-foreground">{card.changeLabel}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}