import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CurrentQueueDisplayProps {
  currentNumber: string | null;
  currentPatient: {
    firstName: string;
    lastName: string;
  } | null;
  isServing: boolean;
}

export function CurrentQueueDisplay({ currentNumber, currentPatient, isServing }: CurrentQueueDisplayProps) {
  return (
    <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <CardTitle className="text-3xl font-bold">Current Queue Number</CardTitle>
          {isServing && (
            <Badge variant="secondary" className="animate-pulse">
              SERVING
            </Badge>
          )}
        </div>
        <div className="text-6xl font-bold mt-4">
          {currentNumber || '---'}
        </div>
        {currentPatient && (
          <div className="text-xl mt-2 opacity-90">
            {currentPatient.firstName} {currentPatient.lastName.charAt(0)}.
          </div>
        )}
        {!currentNumber && (
          <div className="text-lg mt-2 opacity-75">
            No patient currently being served
          </div>
        )}
      </CardHeader>
    </Card>
  );
}