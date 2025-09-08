import { QueueManagement } from '@/components/queue/QueueManagement';

export default function Queue() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Queue Management</h1>
        <p className="text-muted-foreground">Manage patient queue and consultation flow</p>
      </div>
      
      <QueueManagement />
    </div>
  );
}