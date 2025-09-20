import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { CriticalAlert } from '@/hooks/useAppointmentAnalytics';

interface CriticalAlertsPanelProps {
  alerts: CriticalAlert[];
  className?: string;
}

export const CriticalAlertsPanel: React.FC<CriticalAlertsPanelProps> = ({
  alerts,
  className = ""
}) => {
  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'error': return AlertTriangle;
      case 'warning': return AlertCircle;
      case 'info': return Info;
      default: return AlertTriangle;
    }
  };

  const getAlertVariant = (severity: string) => {
    switch (severity) {
      case 'error': return 'destructive';
      case 'warning': return 'default';
      case 'info': return 'default';
      default: return 'default';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      case 'info': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  if (alerts.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          Critical Alerts & Notifications
          <Badge variant="secondary">{alerts.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.map((alert, index) => {
            const AlertIcon = getAlertIcon(alert.severity);
            
            return (
              <Alert key={index} variant={getAlertVariant(alert.severity) as any}>
                <AlertIcon className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{alert.message}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Current: {alert.value.toFixed(1)} | Threshold: {alert.threshold}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={alert.severity === 'error' ? 'destructive' : 'secondary'}
                      className={getSeverityColor(alert.severity)}
                    >
                      {alert.severity.toUpperCase()}
                    </Badge>
                  </div>
                </AlertDescription>
              </Alert>
            );
          })}
        </div>

        {/* Alert Summary */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-3">Alert Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-sm">
                {alerts.filter(a => a.severity === 'error').length} Critical
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span className="text-sm">
                {alerts.filter(a => a.severity === 'warning').length} Warnings
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-sm">
                {alerts.filter(a => a.severity === 'info').length} Info
              </span>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="mt-4 p-4 border border-blue-200 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Recommendations</h4>
          <div className="space-y-1 text-sm text-blue-700">
            {alerts.some(a => a.type === 'high_no_show') && (
              <div>• Review patient reminder processes and follow-up procedures</div>
            )}
            {alerts.some(a => a.type === 'high_cancellation') && (
              <div>• Implement flexible rescheduling options and improve booking confirmation</div>
            )}
            {alerts.some(a => a.type === 'low_utilization') && (
              <div>• Consider redistributing resources or adjusting scheduling patterns</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};