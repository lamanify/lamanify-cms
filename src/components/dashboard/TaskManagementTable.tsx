import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';

interface Task {
  id: string;
  assignedTo: {
    name: string;
    avatar?: string;
  };
  idCode: string;
  age: number;
  createdDate: string;
  dueDate: string;
  status: 'Not started' | 'In progress' | 'Completed';
}

const mockTasks: Task[] = [
  {
    id: '1',
    assignedTo: { name: 'Oliver Harris' },
    idCode: '#00-128',
    age: 36,
    createdDate: 'Feb 22nd, 2022',
    dueDate: 'Mar 20th, 2023',
    status: 'Not started'
  },
  {
    id: '2',
    assignedTo: { name: 'Ethan Bennett' },
    idCode: '#00-127',
    age: 32,
    createdDate: 'Jan 5th, 2022',
    dueDate: 'May 15th, 2023',
    status: 'Not started'
  },
  {
    id: '3',
    assignedTo: { name: 'Tammy Nanc' },
    idCode: '#00-126',
    age: 28,
    createdDate: 'Jan 3rd, 2022',
    dueDate: 'May 15th, 2022',
    status: 'In progress'
  }
];

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'Completed':
      return 'default';
    case 'In progress':
      return 'secondary';
    default:
      return 'outline';
  }
};

export function TaskManagementTable() {
  return (
    <div className="bg-background rounded-lg border border-border">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Task management</h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <span className="text-primary">🔽</span> Filters
              <Badge variant="default" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                1
              </Badge>
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/30">
            <tr className="border-b border-border">
              <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Assigned To</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">ID Code</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Age</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Created date</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Due date</th>
              <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Status</th>
              <th className="w-12 py-3 px-6"></th>
            </tr>
          </thead>
          <tbody>
            {mockTasks.map((task) => (
              <tr key={task.id} className="border-b border-border last:border-b-0 hover:bg-muted/20">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={task.assignedTo.avatar} />
                      <AvatarFallback>
                        {task.assignedTo.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{task.assignedTo.name}</span>
                  </div>
                </td>
                <td className="py-4 px-6 text-sm">{task.idCode}</td>
                <td className="py-4 px-6 text-sm">{task.age}</td>
                <td className="py-4 px-6 text-sm text-muted-foreground">{task.createdDate}</td>
                <td className="py-4 px-6 text-sm text-muted-foreground">{task.dueDate}</td>
                <td className="py-4 px-6">
                  <Badge variant={getStatusVariant(task.status)} className="text-xs">
                    • {task.status}
                  </Badge>
                </td>
                <td className="py-4 px-6">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}