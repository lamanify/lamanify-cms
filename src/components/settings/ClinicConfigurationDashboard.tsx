import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Users, 
  Settings, 
  CreditCard, 
  Bell,
  ArrowLeft,
  Shield,
  Package
} from 'lucide-react';
import { BasicInfoSettings } from './BasicInfoSettings';
import { StaffSettings } from './StaffSettings';
import { SystemSettings } from './SystemSettings';
import { PaymentSettings } from './PaymentSettings';
import { NotificationSettings } from './NotificationSettings';
import { PriceTierManagement } from './PriceTierManagement';
import { useAuth } from '@/hooks/useAuth';

type SettingCategory = 'dashboard' | 'basic_info' | 'staff' | 'system' | 'payment' | 'notifications' | 'price_tiers';

const settingCategories = [
  {
    id: 'basic_info' as const,
    title: 'Basic Clinic Information',
    description: 'Clinic name, address, contact details, and operating hours',
    icon: Building2,
    color: 'bg-blue-500',
  },
  {
    id: 'staff' as const,
    title: 'Staff & User Management',
    description: 'User roles, permissions, and staff configuration',
    icon: Users,
    color: 'bg-green-500',
  },
  {
    id: 'system' as const,
    title: 'System Preferences',
    description: 'Patient registration, queue settings, and system defaults',
    icon: Settings,
    color: 'bg-purple-500',
  },
  {
    id: 'payment' as const,
    title: 'Payment & Billing',
    description: 'Currency, tax rates, payment methods, and billing preferences',
    icon: CreditCard,
    color: 'bg-orange-500',
  },
  {
    id: 'price_tiers' as const,
    title: 'Price Tier Management',
    description: 'Manage different pricing structures for services and medications',
    icon: Package,
    color: 'bg-indigo-500',
  },
  {
    id: 'notifications' as const,
    title: 'Notification Settings',
    description: 'SMS alerts, email templates, and reminder configurations',
    icon: Bell,
    color: 'bg-pink-500',
  },
];

export function ClinicConfigurationDashboard() {
  const [activeCategory, setActiveCategory] = useState<SettingCategory>('dashboard');
  const { user, profile } = useAuth();

  // Check if user is admin
  const isAdmin = profile?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-lg font-medium">Access Restricted</h3>
            <p className="text-sm text-muted-foreground">
              Only administrators can access clinic configuration settings.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const renderSettingComponent = () => {
    switch (activeCategory) {
      case 'basic_info':
        return <BasicInfoSettings onBack={() => setActiveCategory('dashboard')} />;
      case 'staff':
        return <StaffSettings onBack={() => setActiveCategory('dashboard')} />;
      case 'system':
        return <SystemSettings onBack={() => setActiveCategory('dashboard')} />;
      case 'payment':
        return <PaymentSettings onBack={() => setActiveCategory('dashboard')} />;
      case 'price_tiers':
        return <PriceTierManagement />;
      case 'notifications':
        return <NotificationSettings onBack={() => setActiveCategory('dashboard')} />;
      default:
        return null;
    }
  };

  if (activeCategory !== 'dashboard') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setActiveCategory('dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Button>
        </div>
        {renderSettingComponent()}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Clinic Configuration</h1>
        <p className="text-muted-foreground">
          Configure clinic-wide settings and preferences. Changes made here will affect the entire system.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {settingCategories.map((category) => {
          const Icon = category.icon;
          return (
            <Card key={category.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`p-2 rounded-lg ${category.color} text-white`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Admin Only
                  </Badge>
                </div>
                <CardTitle className="text-lg">{category.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {category.description}
                </p>
                <Button 
                  onClick={() => setActiveCategory(category.id)}
                  className="w-full"
                  variant="outline"
                >
                  Configure
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-amber-800">
                Important Security Notice
              </h4>
              <p className="text-sm text-amber-700">
                These settings affect the entire clinic system. Some changes may require staff members to re-login or refresh their sessions. Please ensure you understand the impact of each setting before making changes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}