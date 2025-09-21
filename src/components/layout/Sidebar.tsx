import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserProfile } from '@/hooks/useAuth';
import { 
  Activity, 
  Users, 
  Calendar, 
  FileText, 
  CreditCard,
  Settings,
  Home,
  Clock,
  Monitor,
  TrendingUp,
  Receipt
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  userProfile: UserProfile | null;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Patients', href: '/patients', icon: Users },
  { name: 'Queue Management', href: '/queue', icon: Clock },
  { name: 'Queue Display', href: '/display', icon: Monitor },
  { name: 'Appointments', href: '/appointments', icon: Calendar },
  { name: 'Analytics', href: '/analytics', icon: TrendingUp },
  { name: 'Consultation Waiting', href: '/consultation-waiting', icon: FileText },
  { name: 'Billing', href: '/billing', icon: CreditCard },
  { name: 'Panel Claims', href: '/panel-claims', icon: Receipt },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({ userProfile }: SidebarProps) {
  const location = useLocation();

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'doctor': return 'secondary';
      case 'nurse': return 'outline';
      case 'receptionist': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo and Brand */}
      <div className="p-8">
        <div className="flex items-center space-x-3 mb-8">
          <Activity className="h-6 w-6 text-sidebar-foreground" />
          <div>
            <h1 className="text-lg font-medium text-sidebar-foreground">ClinicCare</h1>
            <p className="text-xs text-sidebar-foreground/60">Management</p>
          </div>
        </div>

        {/* User Profile */}
        {userProfile && (
          <div className="border-t border-sidebar-border pt-6 mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-sidebar-accent rounded flex items-center justify-center">
                <span className="text-sidebar-foreground font-medium text-xs">
                  {userProfile.first_name[0]}{userProfile.last_name[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {userProfile.first_name} {userProfile.last_name}
                </p>
                <Badge variant="outline" className="text-xs mt-1 border-sidebar-border">
                  {userProfile.role}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-6 pb-8">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Button
                key={item.name}
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start font-normal",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-sidebar-foreground hover:bg-slate-800 hover:text-white"
                )}
                asChild
              >
                <Link to={item.href}>
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.name}
                </Link>
              </Button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}