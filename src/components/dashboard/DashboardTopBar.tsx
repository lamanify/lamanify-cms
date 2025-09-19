import { Search, Bell, Calendar, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';

export function DashboardTopBar() {
  const { profile } = useAuth();

  return (
    <div className="flex items-center justify-between py-4 px-6 bg-background border-b border-border">
      {/* Search Box */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search keywords..."
            className="pl-10 bg-background border-input"
          />
        </div>
      </div>

      {/* Right Side - Date Range, Notifications, User */}
      <div className="flex items-center gap-4">
        {/* Date Range Selector */}
        <Button variant="outline" className="gap-2">
          <Calendar className="h-4 w-4" />
          Week
        </Button>

        {/* Export Button */}
        <Button className="gap-2">
          Export
        </Button>

        {/* Notification Bell */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            3
          </Badge>
        </Button>

        {/* User Avatar and Info */}
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src="" />
            <AvatarFallback>
              {profile?.first_name?.[0] || 'U'}{profile?.last_name?.[0] || ''}
            </AvatarFallback>
          </Avatar>
          <div className="text-right">
            <p className="text-sm font-medium">
              {profile?.first_name} {profile?.last_name}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {profile?.role || 'User'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}