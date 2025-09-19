import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth, UserProfile } from '@/hooks/useAuth';
import { LogOut, Settings, User } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface HeaderProps {
  userProfile: UserProfile | null;
}

const getPageTitle = (pathname: string) => {
  switch (pathname) {
    case '/': return 'Dashboard';
    case '/patients': return 'Patient Management';
    case '/appointments': return 'Appointment Scheduling';
    case '/consultations': return 'Consultation Notes';
    case '/billing': return 'Billing & Payments';
    case '/settings': return 'Settings';
    default: return 'ClinicCare';
  }
};

export function Header({ userProfile }: HeaderProps) {
  const { signOut } = useAuth();
  const location = useLocation();

  return (
    <header className="h-16 border-b border-border bg-background">
      <div className="flex items-center justify-between h-full px-8">
        <div>
          <h2 className="text-lg font-medium text-foreground">
            {getPageTitle(location.pathname)}
          </h2>
          <p className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {userProfile && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded"
                >
                  <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                    <span className="text-muted-foreground font-medium text-xs">
                      {userProfile.first_name[0]}{userProfile.last_name[0]}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {userProfile.first_name} {userProfile.last_name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userProfile.email} • {userProfile.role}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}