import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { 
  Globe, 
  Key, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw,
  Plus,
  Settings,
  TestTube,
  Trash2
} from 'lucide-react';
import { PanelClaim } from '@/hooks/usePanelClaims';
import { format } from 'date-fns';
import { useClaimsIntegrations, IntegrationConfig, WebhookDelivery } from '@/hooks/useClaimsIntegrations';

interface SubmissionLog {
  id: string;
  claim_id: string;
  integration_config_id: string;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  request_data: any;
  response_data?: any;
  error_message?: string;
  attempt_count: number;
  submitted_at: string;
  completed_at?: string;
}

export function ClaimsIntegrationManager() {
  const { toast } = useToast();
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<IntegrationConfig | null>(null);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [webhookDeliveries, setWebhookDeliveries] = useState<Record<string, WebhookDelivery[]>>({});
  
  const {
    integrations,
    loading,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    testConnection,
    fetchWebhookDeliveries,
  } = useClaimsIntegrations();

  const handleTestConnection = async (configId: string) => {
    const integration = integrations.find(i => i.id === configId);
    const integrationName = integration?.name || 'Integration';
    
    setTestingConnection(configId);
    try {
      await testConnection(configId);
      // Refresh webhook deliveries after test
      const deliveries = await fetchWebhookDeliveries(configId);
      setWebhookDeliveries(prev => ({ ...prev, [configId]: deliveries }));
      
      toast({
        title: "Connection successful",
        description: `Successfully connected to ${integrationName}`,
      });
    } catch (error) {
      toast({
        title: "Connection failed",
        description: `Failed to connect to ${integrationName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setTestingConnection(null);
    }
  };

  const handleSaveIntegration = async () => {
    const form = document.getElementById('integration-form') as HTMLFormElement;
    if (!form) return;

    const formData = new FormData(form);
    const data: any = {
      name: formData.get('name') as string,
      provider: formData.get('provider') as string,
      endpoint_url: formData.get('endpoint_url') as string,
      authentication_type: formData.get('authentication_type') as string,
      retry_attempts: parseInt(formData.get('retry_attempts') as string),
      timeout_seconds: parseInt(formData.get('timeout_seconds') as string),
      webhook_url: formData.get('webhook_url') as string || undefined,
      is_active: formData.get('is_active') === 'on',
    };

    // Parse headers JSON
    const headersStr = formData.get('headers') as string;
    if (headersStr) {
      try {
        data.headers = JSON.parse(headersStr);
      } catch (e) {
        data.headers = {};
      }
    }

    // Only include API key if it's being changed
    const apiKey = formData.get('api_key') as string;
    if (apiKey && apiKey.trim()) {
      data.api_key = apiKey;
    }

    try {
      if (selectedConfig) {
        await updateIntegration(selectedConfig.id, data);
      } else {
        if (!data.api_key) {
          throw new Error('API key is required for new integrations');
        }
        await createIntegration(data);
      }
      setShowConfigDialog(false);
      setSelectedConfig(null);
      setShowApiKeyInput(false);
    } catch (error) {
      console.error('Error saving integration:', error);
    }
  };

  const ConfigurationDialog = () => (
    <Dialog open={showConfigDialog} onOpenChange={(open) => {
      setShowConfigDialog(open);
      if (!open) {
        setSelectedConfig(null);
        setShowApiKeyInput(false);
      }
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {selectedConfig ? 'Edit Integration' : 'Add New Integration'}
          </DialogTitle>
        </DialogHeader>

        <form id="integration-form" className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Integration Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Great Eastern TPA"
                defaultValue={selectedConfig?.name}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Select name="provider" defaultValue={selectedConfig?.provider || 'custom'}>
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="great_eastern">Great Eastern</SelectItem>
                  <SelectItem value="allianz">Allianz</SelectItem>
                  <SelectItem value="aia">AIA</SelectItem>
                  <SelectItem value="prudential">Prudential</SelectItem>
                  <SelectItem value="custom">Custom TPA</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endpoint_url">API Endpoint URL</Label>
            <Input
              id="endpoint_url"
              name="endpoint_url"
              placeholder="https://api.example.com/claims/submit"
              defaultValue={selectedConfig?.endpoint_url}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="authentication_type">Authentication Type</Label>
              <Select name="authentication_type" defaultValue={selectedConfig?.authentication_type || 'api_key'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="api_key">API Key</SelectItem>
                  <SelectItem value="bearer_token">Bearer Token</SelectItem>
                  <SelectItem value="basic_auth">Basic Authentication</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="api_key">API Key / Token</Label>
              {selectedConfig && !showApiKeyInput ? (
                <div className="flex gap-2">
                  <Input
                    value={selectedConfig.api_key_masked}
                    disabled
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowApiKeyInput(true)}
                  >
                    <Key className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Input
                  id="api_key"
                  name="api_key"
                  type="password"
                  placeholder={selectedConfig ? "Enter new key to change" : "Enter API key or token"}
                  required={!selectedConfig}
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="headers">Custom Headers (JSON)</Label>
            <Textarea
              id="headers"
              name="headers"
              placeholder='{"Content-Type": "application/json", "X-Partner-ID": "CLINIC001"}'
              className="h-20"
              defaultValue={selectedConfig?.headers ? JSON.stringify(selectedConfig.headers, null, 2) : ''}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="retry_attempts">Retry Attempts</Label>
              <Input
                id="retry_attempts"
                name="retry_attempts"
                type="number"
                min="1"
                max="10"
                defaultValue={selectedConfig?.retry_attempts || 3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeout_seconds">Timeout (seconds)</Label>
              <Input
                id="timeout_seconds"
                name="timeout_seconds"
                type="number"
                min="10"
                max="300"
                defaultValue={selectedConfig?.timeout_seconds || 30}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="is_active">Status</Label>
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="is_active"
                  name="is_active"
                  defaultChecked={selectedConfig?.is_active !== false}
                />
                <Label htmlFor="is_active" className="text-sm">Active</Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhook_url">Webhook URL (Optional)</Label>
            <Input
              id="webhook_url"
              name="webhook_url"
              placeholder="https://api.example.com/webhooks/status"
              defaultValue={selectedConfig?.webhook_url}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowConfigDialog(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveIntegration} disabled={loading}>
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {selectedConfig ? 'Update' : 'Create'} Integration
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Claims Integration</h2>
          <p className="text-muted-foreground">
            Configure and manage API integrations with TPA and insurance providers
          </p>
        </div>
        <Button onClick={() => {
          setSelectedConfig(null);
          setShowConfigDialog(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Integration
        </Button>
      </div>

      <Tabs defaultValue="integrations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="submissions">Submission Logs</TabsTrigger>
          <TabsTrigger value="webhooks">Webhook Status</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-4">
          {integrations.map((integration) => (
            <Card key={integration.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Globe className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <span>{integration.provider}</span>
                        <Badge variant={integration.is_active ? "default" : "secondary"}>
                          {integration.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestConnection(integration.id)}
                      disabled={testingConnection === integration.id}
                    >
                      {testingConnection === integration.id ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <TestTube className="h-4 w-4 mr-2" />
                          Test
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedConfig(integration);
                        setShowConfigDialog(true);
                      }}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium">Endpoint</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {integration.endpoint_url}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Success Rate</p>
                    <p className="text-xs text-muted-foreground">
                      {integration.success_count + integration.error_count > 0 
                        ? Math.round((integration.success_count / (integration.success_count + integration.error_count)) * 100)
                        : 0}% 
                      <span className="ml-1">
                        ({integration.success_count}/{integration.success_count + integration.error_count})
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Last Used</p>
                    <p className="text-xs text-muted-foreground">
                      {integration.last_used_at 
                        ? format(new Date(integration.last_used_at), 'MMM dd, HH:mm')
                        : 'Never'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Configuration</p>
                    <p className="text-xs text-muted-foreground">
                      {integration.authentication_type.replace('_', ' ').toUpperCase()}, 
                      {integration.retry_attempts} retries
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {integrations.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No integrations configured</h3>
                <p className="text-muted-foreground mb-4">
                  Set up API integrations with TPA and insurance providers to automate claim submissions.
                </p>
                <Button onClick={() => {
                  setSelectedConfig(null);
                  setShowConfigDialog(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Integration
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="submissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Submissions</CardTitle>
              <CardDescription>
                Track claim submissions to external TPA systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No submissions yet</p>
                <p className="text-sm">Submissions will appear here once you start sending claims to TPAs</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Status</CardTitle>
              <CardDescription>
                Monitor webhook responses from TPA systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No webhook activity</p>
                <p className="text-sm">Webhook status updates will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfigurationDialog />
    </div>
  );
}