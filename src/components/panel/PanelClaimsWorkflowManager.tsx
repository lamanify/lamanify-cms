import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { usePanelClaimsWorkflow } from '@/hooks/usePanelClaimsWorkflow';
import { usePanels } from '@/hooks/usePanels';
import { 
  Settings, 
  Clock, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Plus,
  Play,
  Pause
} from 'lucide-react';

export const PanelClaimsWorkflowManager = () => {
  const {
    workflows,
    approvalRequests,
    statusRules,
    claimSchedules,
    createWorkflow,
    processApprovalRequest,
    createStatusRule,
    createClaimSchedule
  } = usePanelClaimsWorkflow();
  const { panels } = usePanels();

  const [workflowDialog, setWorkflowDialog] = useState(false);
  const [ruleDialog, setRuleDialog] = useState(false);
  const [scheduleDialog, setScheduleDialog] = useState(false);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'pending': return 'secondary';
      case 'expired': return 'outline';
      default: return 'secondary';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Panel Claims Workflow</h2>
          <p className="text-muted-foreground">
            Manage approval workflows, status rules, and automated claim generation
          </p>
        </div>
      </div>

      <Tabs defaultValue="workflows" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="workflows">Approval Workflows</TabsTrigger>
          <TabsTrigger value="requests">Pending Requests</TabsTrigger>
          <TabsTrigger value="rules">Status Rules</TabsTrigger>
          <TabsTrigger value="schedules">Claim Schedules</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Approval Workflows</h3>
            <Dialog open={workflowDialog} onOpenChange={setWorkflowDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Workflow
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Approval Workflow</DialogTitle>
                </DialogHeader>
                <WorkflowForm 
                  panels={panels}
                  onSubmit={createWorkflow}
                  onClose={() => setWorkflowDialog(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workflow Name</TableHead>
                  <TableHead>Panel</TableHead>
                  <TableHead>Amount Range</TableHead>
                  <TableHead>Required Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workflows.map((workflow) => (
                  <TableRow key={workflow.id}>
                    <TableCell className="font-medium">{workflow.workflow_name}</TableCell>
                    <TableCell>
                      {workflow.panel_id ? 
                        panels.find(p => p.id === workflow.panel_id)?.panel_name || 'Unknown' :
                        'All Panels'
                      }
                    </TableCell>
                    <TableCell>
                      ${workflow.min_approval_amount}
                      {workflow.max_approval_amount && ` - $${workflow.max_approval_amount}`}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{workflow.required_role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
                        {workflow.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <h3 className="text-lg font-semibold">Pending Approval Requests</h3>
          
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claim Number</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Requested At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvalRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {(request as any).panel_claims?.claim_number}
                    </TableCell>
                    <TableCell>${request.request_amount.toFixed(2)}</TableCell>
                    <TableCell>
                      {(request as any).profiles 
                        ? `${(request as any).profiles.first_name} ${(request as any).profiles.last_name}`
                        : 'Unknown'
                      }
                    </TableCell>
                    <TableCell>{formatDateTime(request.requested_at)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(request.status)}>
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => processApprovalRequest(request.id, 'approve')}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => processApprovalRequest(request.id, 'reject')}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Status Progression Rules</h3>
            <Dialog open={ruleDialog} onOpenChange={setRuleDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Status Rule</DialogTitle>
                </DialogHeader>
                <StatusRuleForm 
                  onSubmit={createStatusRule}
                  onClose={() => setRuleDialog(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule Name</TableHead>
                  <TableHead>Transition</TableHead>
                  <TableHead>Trigger Type</TableHead>
                  <TableHead>Auto Execute</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statusRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.rule_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{rule.from_status}</Badge>
                        <span>→</span>
                        <Badge variant="outline">{rule.to_status}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{rule.trigger_type}</Badge>
                    </TableCell>
                    <TableCell>
                      {rule.auto_execute ? (
                        <Play className="w-4 h-4 text-green-500" />
                      ) : (
                        <Pause className="w-4 h-4 text-gray-400" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="schedules" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Claim Generation Schedules</h3>
            <Dialog open={scheduleDialog} onOpenChange={setScheduleDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Schedule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Claim Schedule</DialogTitle>
                </DialogHeader>
                <ScheduleForm 
                  panels={panels}
                  onSubmit={createClaimSchedule}
                  onClose={() => setScheduleDialog(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Schedule Name</TableHead>
                  <TableHead>Panel</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Next Generation</TableHead>
                  <TableHead>Auto Submit</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {claimSchedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium">{schedule.schedule_name}</TableCell>
                    <TableCell>
                      {(schedule as any).panels?.panel_name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{schedule.frequency}</Badge>
                    </TableCell>
                    <TableCell>
                      {schedule.next_generation_at 
                        ? formatDateTime(schedule.next_generation_at)
                        : 'Not scheduled'
                      }
                    </TableCell>
                    <TableCell>
                      {schedule.auto_submit ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-400" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={schedule.is_active ? 'default' : 'secondary'}>
                        {schedule.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Form components would be here but truncated for brevity
const WorkflowForm = ({ panels, onSubmit, onClose }: any) => <div>Workflow Form</div>;
const StatusRuleForm = ({ onSubmit, onClose }: any) => <div>Status Rule Form</div>;
const ScheduleForm = ({ panels, onSubmit, onClose }: any) => <div>Schedule Form</div>;