import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  Settings, 
  Globe, 
  Key, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  Plus,
  Eye,
  Trash2,
  TestTube
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PanelClaim } from '@/hooks/usePanelClaims';
import { format } from 'date-fns';

interface IntegrationConfig {
  id: string;
  name: string;
  provider: string;
  endpoint_url: string;
  api_key: string;
  authentication_type: 'api_key' | 'bearer_token' | 'basic_auth';
  headers: Record<string, string>;
  is_active: boolean;
  retry_attempts: number;
  timeout_seconds: number;
  webhook_url?: string;
  created_at: string;
  last_used_at?: string;
  success_count: number;
  error_count: number;
}

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
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<IntegrationConfig | null>(null);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  
  const { toast } = useToast();

  // Mock data - in real implementation, these would come from Supabase
  useEffect(() => {
    // Load integration configurations and submission logs
    const mockIntegrations: IntegrationConfig[] = [
      {
        id: '1',
        name: 'Great Eastern TPA',
        provider: 'great_eastern',
        endpoint_url: 'https://api.greateasterntpa.com/claims/submit',
        api_key: 'ge_api_key_hidden',
        authentication_type: 'api_key',
        headers: { 'Content-Type': 'application/json' },
        is_active: true,
        retry_attempts: 3,
        timeout_seconds: 30,
        webhook_url: 'https://api.greateasterntpa.com/webhooks/status',
        created_at: '2024-01-15T10:00:00Z',
        last_used_at: '2024-01-20T14:30:00Z',
        success_count: 45,
        error_count: 2,
      },
      {
        id: '2',
        name: 'Allianz Claims Portal',
        provider: 'allianz',
        endpoint_url: 'https://claims.allianz.com.my/api/v2/submit',
        api_key: 'allianz_token_hidden',
        authentication_type: 'bearer_token',
        headers: { 'Content-Type': 'application/json', 'X-Partner-ID': 'CLINIC001' },
        is_active: false,
        retry_attempts: 5,
        timeout_seconds: 45,
        created_at: '2024-01-10T09:00:00Z',
        success_count: 12,
        error_count: 8,
      },
    ];
    
    setIntegrations(mockIntegrations);
  }, []);

  const handleTestConnection = async (configId: string) => {
    setTestingConnection(configId);
    
    try {
      // Simulate API test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock success/failure
      const success = Math.random() > 0.3;
      
      if (success) {
        toast({
          title: "Connection successful",
          description: "API endpoint is responding correctly.",
        });
      } else {
        toast({
          title: "Connection failed",
          description: "Unable to connect to API endpoint. Please check configuration.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Test failed",
        description: "Error testing connection.",
        variant: "destructive",
      });
    } finally {
      setTestingConnection(null);
    }
  };

  const handleSubmitClaim = async (claim: PanelClaim, configId: string) => {
    setLoading(true);
    
    try {
      const config = integrations.find(i => i.id === configId);
      if (!config) throw new Error('Integration configuration not found');

      // Prepare claim data for submission
      const claimData = {
        claim_number: claim.claim_number,
        panel_reference: claim.panel_reference_number,
        billing_period: {
          start: claim.billing_period_start,
          end: claim.billing_period_end,
        },
        total_amount: claim.total_amount,
        items: claim.claim_items?.map(item => ({
          invoice_number: item.billing?.invoice_number,
          description: item.billing?.description,
          amount: item.claim_amount,
        })) || [],
      };

      // Simulate API submission
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock response
      const success = Math.random() > 0.2;
      
      if (success) {
        toast({
          title: "Claim submitted successfully",
          description: `Claim ${claim.claim_number} has been sent to ${config.name}.`,
        });
        
        // Update integration stats
        setIntegrations(prev => prev.map(integration => 
          integration.id === configId 
            ? { 
                ...integration, 
                success_count: integration.success_count + 1,
                last_used_at: new Date().toISOString()
              }
            : integration
        ));
      } else {
        throw new Error('Submission rejected by TPA system');
      }
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.message || "Failed to submit claim to TPA.",
        variant: "destructive",
      });
      
      // Update error count
      setIntegrations(prev => prev.map(integration => 
        integration.id === configId 
          ? { ...integration, error_count: integration.error_count + 1 }
          : integration
      ));
    } finally {
      setLoading(false);
    }
  };

  const ConfigurationDialog = () => (
    <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {selectedConfig ? 'Edit Integration' : 'Add New Integration'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="integration-name">Integration Name</Label>
              <Input
                id="integration-name"
                placeholder="e.g., Great Eastern TPA"
                defaultValue={selectedConfig?.name}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Select defaultValue={selectedConfig?.provider}>
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
            <Label htmlFor="endpoint-url">API Endpoint URL</Label>
            <Input
              id="endpoint-url"
              placeholder="https://api.example.com/claims/submit"
              defaultValue={selectedConfig?.endpoint_url}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="auth-type">Authentication Type</Label>
              <Select defaultValue={selectedConfig?.authentication_type || 'api_key'}>
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
              <Label htmlFor="api-key">API Key / Token</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="Enter API key or token"
                defaultValue={selectedConfig?.api_key}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="headers">Custom Headers (JSON)</Label>
            <Textarea
              id="headers"
              placeholder='{"Content-Type": "application/json", "X-Partner-ID": "CLINIC001"}'
              className="h-20"
              defaultValue={selectedConfig?.headers ? JSON.stringify(selectedConfig.headers, null, 2) : ''}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="retry-attempts">Retry Attempts</Label>
              <Input
                id="retry-attempts"
                type="number"
                min="1"
                max="10"
                defaultValue={selectedConfig?.retry_attempts || 3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeout">Timeout (seconds)</Label>
              <Input
                id="timeout"
                type="number"
                min="10"
                max="300"
                defaultValue={selectedConfig?.timeout_seconds || 30}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="is-active">Status</Label>
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="is-active"
                  defaultChecked={selectedConfig?.is_active !== false}
                />
                <Label htmlFor="is-active" className="text-sm">Active</Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhook-url">Webhook URL (Optional)</Label>
            <Input
              id="webhook-url"
              placeholder="https://api.example.com/webhooks/status"
              defaultValue={selectedConfig?.webhook_url}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
              Cancel
            </Button>
            <Button>
              {selectedConfig ? 'Update' : 'Create'} Integration
            </Button>
          </div>
        </div>
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
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <TestTube className="h-4 w-4 mr-2" />
                      )}
                      Test
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
                <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
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