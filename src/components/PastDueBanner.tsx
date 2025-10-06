import { AlertTriangle, CreditCard, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PastDueBannerProps {
  gracePeriodEndsAt: string;
}

export function PastDueBanner({ gracePeriodEndsAt }: PastDueBannerProps) {
  const navigate = useNavigate();
  
  const gracePeriodEnd = new Date(gracePeriodEndsAt);
  const now = new Date();
  const timeLeft = gracePeriodEnd.getTime() - now.getTime();
  const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.ceil(timeLeft / (1000 * 60 * 60));
  
  const getTimeLeftText = () => {
    if (daysLeft > 1) {
      return `${daysLeft} days left`;
    } else if (hoursLeft > 1) {
      return `${hoursLeft} hours left`;
    } else {
      return 'Less than 1 hour left';
    }
  };

  const getUrgencyColor = () => {
    if (daysLeft <= 1) return 'border-red-400 bg-red-50';
    if (daysLeft <= 3) return 'border-orange-400 bg-orange-50';
    return 'border-yellow-400 bg-yellow-50';
  };

  const getTextColor = () => {
    if (daysLeft <= 1) return 'text-red-800';
    if (daysLeft <= 3) return 'text-orange-800';
    return 'text-yellow-800';
  };

  const getIconColor = () => {
    if (daysLeft <= 1) return 'text-red-600';
    if (daysLeft <= 3) return 'text-orange-600';
    return 'text-yellow-600';
  };

  return (
    <Alert className={`mb-6 border-l-4 ${getUrgencyColor()}`}>
      <AlertTriangle className={`h-5 w-5 ${getIconColor()}`} />
      <AlertDescription>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className={`font-semibold ${getTextColor()}`}>
                ⚠️ Payment Issue - {getTimeLeftText()}
              </span>
              {daysLeft <= 1 && (
                <span className="animate-pulse text-red-600">
                  <Clock className="h-4 w-4" />
                </span>
              )}
            </div>
            <p className={`text-sm ${getTextColor()}`}>
              {daysLeft <= 1 
                ? 'Urgent: Your subscription will be suspended soon. Update your payment method now to avoid losing access.'
                : 'Your payment failed. Please update your payment method to avoid service interruption.'
              }
            </p>
            <div className="mt-2 text-xs opacity-75">
              Access will be suspended on: {gracePeriodEnd.toLocaleDateString('en-MY', {
                weekday: 'long',
                year: 'numeric',
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
          <div className="ml-4 flex-shrink-0">
            <Button 
              onClick={() => navigate('/billing')} 
              size="sm"
              className={daysLeft <= 1 ? 'bg-red-600 hover:bg-red-700 animate-pulse' : ''}
            >
              <CreditCard className="mr-1 h-4 w-4" />
              {daysLeft <= 1 ? 'Update Now!' : 'Update Payment'}
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}