import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQueue } from '@/hooks/useQueue';
import { Clock, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

export function PublicQueueDisplay() {
  const { queue, loading, currentNumber, getEstimatedWaitTime } = useQueue();
  const [isBlinking, setIsBlinking] = useState(false);

  const waitingQueue = queue.filter(entry => entry.status === 'waiting');
  const nextFewPatients = waitingQueue.slice(0, 5);
  const currentPatient = queue.find(entry => entry.status === 'in_consultation');

  // Play chime and trigger blink animation when current number changes
  useEffect(() => {
    if (currentNumber) {
      // Play notification chime
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmTpL3v');
        audio.play().catch(() => console.log('Audio notification failed'));
      } catch (error) {
        console.log('Audio notification failed');
      }
      
      // Trigger blink animation
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 3000); // Blink for 3 seconds
    }
  }, [currentNumber]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading queue information...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-8">
      <style>
        {`
          @keyframes blink-glow {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.05); }
          }
          
          .blink-animation {
            animation: blink-glow 0.8s ease-in-out infinite;
          }
        `}
      </style>
      
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Medical Center Queue
          </h1>
          <p className="text-xl text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Current Number Display - Enhanced with Blinking */}
        <Card className={`bg-gradient-to-r from-primary to-primary-dark text-primary-foreground ${isBlinking ? 'blink-animation' : ''}`}>
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">Now Serving</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className={`text-9xl font-bold mb-4 transition-all duration-300 ${isBlinking ? 'scale-110' : ''}`}>
              {currentNumber || '---'}
            </div>
            <p className="text-lg opacity-90">
              Please proceed to the consultation room
            </p>
          </CardContent>
        </Card>

        {/* Waiting Queue */}
        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Waiting Queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              {nextFewPatients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No patients waiting
                </div>
              ) : (
                <div className="space-y-3">
                  {nextFewPatients.map((entry, index) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="text-lg font-bold">
                          {entry.queue_number}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Position {index + 1}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="mr-1 h-4 w-4" />
                        ~{getEstimatedWaitTime(entry.queue_number)} min
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Queue Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Patients</span>
                  <span className="text-2xl font-bold">{queue.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Currently Waiting</span>
                  <span className="text-2xl font-bold text-yellow-600">
                    {waitingQueue.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="text-2xl font-bold text-green-600">
                    {queue.filter(q => q.status === 'completed').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Average Wait</span>
                  <span className="text-2xl font-bold">
                    {waitingQueue.length > 0 
                      ? Math.round(waitingQueue.reduce((acc, entry) => 
                          acc + getEstimatedWaitTime(entry.queue_number), 0) / waitingQueue.length)
                      : 0
                    } min
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold">Instructions</p>
              <div className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div>
                  <Badge className="mb-2">1</Badge>
                  <p>Check in at the reception desk to get your queue number</p>
                </div>
                <div>
                  <Badge className="mb-2">2</Badge>
                  <p>Wait for your number to be called on this display</p>
                </div>
                <div>
                  <Badge className="mb-2">3</Badge>
                  <p>Proceed to the consultation room when called</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
