import { useNavigate } from 'react-router-dom';
import { AlertCircle, Activity, CreditCard, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function InactiveSubscription() {
  const navigate = useNavigate();

  const handleContactSupport = () => {
    window.location.href = 'mailto:support@lamanify.com?subject=LamaniHub Subscription Issue&body=Hi Lamanify team, I need help with my subscription. Please assist.';
  };

  const handleUpdatePayment = () => {
    navigate('/billing');
  };

  const handleBackToAuth = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent/20 p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Activity className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">LamaniHub</h1>
          </div>
        </div>

        {/* Main Card */}
        <Card className="border-red-200">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-600">Subscription Inactive</CardTitle>
            <CardDescription className="text-base">
              Your LamaniHub subscription needs attention to continue managing your clinic.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-2">What happened?</h3>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Your subscription payment may have failed</li>
                <li>• Your subscription may have been cancelled</li>
                <li>• There might be an issue with your payment method</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handleUpdatePayment}
                className="w-full bg-green-600 hover:bg-green-700" 
                size="lg"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Update Payment Method
              </Button>
              
              <Button 
                onClick={handleContactSupport}
                variant="outline"
                className="w-full" 
                size="lg"
              >
                <Mail className="mr-2 h-4 w-4" />
                Contact Support Team
              </Button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">💡 Good News!</h3>
              <p className="text-sm text-blue-700">
                Your clinic data is completely safe and will be restored immediately once your subscription is reactivated.
              </p>
            </div>

            <div className="text-center pt-4 border-t">
              <Button 
                variant="ghost" 
                onClick={handleBackToAuth}
                className="text-muted-foreground"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Support Info */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Questions? We're here to help!
          </p>
          <div className="flex justify-center space-x-4 text-xs text-muted-foreground">
            <span>📧 support@lamanify.com</span>
            <span>📞 +60 12-345 6789</span>
          </div>
        </div>
      </div>
    </div>
  );
}