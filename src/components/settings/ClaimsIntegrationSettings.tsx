import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Globe, 
  Shield, 
  Bell, 
  Settings2, 
  Key,
  Webhook,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ClaimsIntegrationSettingsProps {
  onBack?: () => void;
}

export function ClaimsIntegrationSettings({ onBack }: ClaimsIntegrationSettingsProps) {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    // General API Settings
    auto_submit_approved_claims: false,
    max_retry_attempts: 3,
    timeout_seconds: 30,
    batch_submission_enabled: false,
    batch_size: 10,
    
    // Security Settings
    encrypt_api_keys: true,
    log_api_requests: true,
    mask_sensitive_data: true,
    ip_whitelist_enabled: false,
    allowed_ips: '',
    
    // Notification Settings
    notify_on_success: true,
    notify_on_failure: true,
    notify_on_webhook: false,
    notification_email: '',
    
    // Webhook Settings
    webhook_signature_verification: true,
    webhook_timeout_seconds: 10,
    webhook_retry_attempts: 2,
  });
  
  const { toast } = useToast();

  const handleSave = async () => {
    setLoading(true);
    
    try {
      // Simulate API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Settings saved",
        description: "Claims integration settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: "Failed to save integration settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {onBack && (
          <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        )}
        <div>
          <h2 className="text-2xl font-bold">Claims Integration Settings</h2>
          <p className="text-muted-foreground">
            Configure global settings for third-party API integrations
          </p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                API Integration Settings
              </CardTitle>
              <CardDescription>
                Configure how claims are automatically submitted to external systems
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Auto-submit approved claims</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically send claims to configured TPAs when approved
                  </p>
                </div>
                <Switch
                  checked={settings.auto_submit_approved_claims}
                  onCheckedChange={(checked) => updateSetting('auto_submit_approved_claims', checked)}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="retry-attempts">Maximum Retry Attempts</Label>
                  <Input
                    id="retry-attempts"
                    type="number"
                    min="1"
                    max="10"
                    value={settings.max_retry_attempts}
                    onChange={(e) => updateSetting('max_retry_attempts', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of times to retry failed API calls
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timeout">Request Timeout (seconds)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    min="10"
                    max="300"
                    value={settings.timeout_seconds}
                    onChange={(e) => updateSetting('timeout_seconds', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum time to wait for API responses
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Batch Submission</Label>
                    <p className="text-sm text-muted-foreground">
                      Submit multiple claims in a single API call when supported
                    </p>
                  </div>
                  <Switch
                    checked={settings.batch_submission_enabled}
                    onCheckedChange={(checked) => updateSetting('batch_submission_enabled', checked)}
                  />
                </div>

                {settings.batch_submission_enabled && (
                  <div className="ml-4 space-y-2">
                    <Label htmlFor="batch-size">Batch Size</Label>
                    <Input
                      id="batch-size"
                      type="number"
                      min="1"
                      max="50"
                      value={settings.batch_size}
                      onChange={(e) => updateSetting('batch_size', parseInt(e.target.value))}
                      className="w-32"
                    />
                    <p className="text-xs text-muted-foreground">
                      Number of claims to submit per batch
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security & Privacy Settings
              </CardTitle>
              <CardDescription>
                Configure security measures for API integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Encrypt API Keys</Label>
                  <p className="text-sm text-muted-foreground">
                    Store API keys and tokens using encryption
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={settings.encrypt_api_keys}
                    onCheckedChange={(checked) => updateSetting('encrypt_api_keys', checked)}
                  />
                  <Badge variant="default" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Recommended
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Log API Requests</Label>
                  <p className="text-sm text-muted-foreground">
                    Keep detailed logs of all API requests and responses
                  </p>
                </div>
                <Switch
                  checked={settings.log_api_requests}
                  onCheckedChange={(checked) => updateSetting('log_api_requests', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Mask Sensitive Data</Label>
                  <p className="text-sm text-muted-foreground">
                    Hide sensitive information in logs and UI
                  </p>
                </div>
                <Switch
                  checked={settings.mask_sensitive_data}
                  onCheckedChange={(checked) => updateSetting('mask_sensitive_data', checked)}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>IP Address Whitelist</Label>
                    <p className="text-sm text-muted-foreground">
                      Restrict API access to specific IP addresses
                    </p>
                  </div>
                  <Switch
                    checked={settings.ip_whitelist_enabled}
                    onCheckedChange={(checked) => updateSetting('ip_whitelist_enabled', checked)}
                  />
                </div>

                {settings.ip_whitelist_enabled && (
                  <div className="ml-4 space-y-2">
                    <Label htmlFor="allowed-ips">Allowed IP Addresses</Label>
                    <Input
                      id="allowed-ips"
                      placeholder="192.168.1.1, 10.0.0.0/24"
                      value={settings.allowed_ips}
                      onChange={(e) => updateSetting('allowed_ips', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Comma-separated list of IP addresses or CIDR ranges
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure when and how to receive integration notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="notification-email">Notification Email</Label>
                <Input
                  id="notification-email"
                  type="email"
                  placeholder="admin@clinic.com"
                  value={settings.notification_email}
                  onChange={(e) => updateSetting('notification_email', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Email address to receive integration notifications
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Notify on Success</Label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications when claims are successfully submitted
                    </p>
                  </div>
                  <Switch
                    checked={settings.notify_on_success}
                    onCheckedChange={(checked) => updateSetting('notify_on_success', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Notify on Failure</Label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications when claim submissions fail
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={settings.notify_on_failure}
                      onCheckedChange={(checked) => updateSetting('notify_on_failure', checked)}
                    />
                    <Badge variant="default" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Important
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Notify on Webhook Events</Label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications for webhook status updates
                    </p>
                  </div>
                  <Switch
                    checked={settings.notify_on_webhook}
                    onCheckedChange={(checked) => updateSetting('notify_on_webhook', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Webhook Configuration
              </CardTitle>
              <CardDescription>
                Configure how to handle webhook responses from TPA systems
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Signature Verification</Label>
                  <p className="text-sm text-muted-foreground">
                    Verify webhook signatures to ensure authenticity
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={settings.webhook_signature_verification}
                    onCheckedChange={(checked) => updateSetting('webhook_signature_verification', checked)}
                  />
                  <Badge variant="default" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    Secure
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="webhook-timeout">Webhook Timeout (seconds)</Label>
                  <Input
                    id="webhook-timeout"
                    type="number"
                    min="5"
                    max="60"
                    value={settings.webhook_timeout_seconds}
                    onChange={(e) => updateSetting('webhook_timeout_seconds', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum time to wait for webhook processing
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="webhook-retries">Webhook Retry Attempts</Label>
                  <Input
                    id="webhook-retries"
                    type="number"
                    min="0"
                    max="5"
                    value={settings.webhook_retry_attempts}
                    onChange={(e) => updateSetting('webhook_retry_attempts', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of times to retry failed webhook processing
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 pt-6 border-t">
        <Button variant="outline" onClick={onBack}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            'Save Settings'
          )}
        </Button>
      </div>
    </div>
  );
}