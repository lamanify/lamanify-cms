import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Users, 
  Tag, 
  UserPlus, 
  Calendar, 
  MessageSquare, 
  Trash2, 
  Archive,
  Mail,
  Phone,
  MoreHorizontal
} from 'lucide-react';

interface BulkActionToolbarProps {
  selectedCount: number;
  selectedPatients: string[];
  onAction: (action: string) => void;
}

export function BulkActionToolbar({ selectedCount, selectedPatients, onAction }: BulkActionToolbarProps) {
  const handleAction = (action: string) => {
    onAction(action);
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <Badge variant="default" className="bg-primary">
                {selectedCount} selected
              </Badge>
            </div>
            <span className="text-sm text-muted-foreground">
              Choose an action to apply to selected patients
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Actions */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction('assign_tag')}
            >
              <Tag className="h-4 w-4 mr-2" />
              Tag
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction('assign_tier')}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Assign Tier
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction('schedule_appointment')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule
            </Button>

            {/* More Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4 mr-2" />
                  More Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => handleAction('send_notification')}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Notification
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction('send_email')}>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction('send_sms')}>
                  <Phone className="h-4 w-4 mr-2" />
                  Send SMS
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction('create_group')}>
                  <Users className="h-4 w-4 mr-2" />
                  Create Patient Group
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction('archive')}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive Patients
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleAction('delete')}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Patients
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}