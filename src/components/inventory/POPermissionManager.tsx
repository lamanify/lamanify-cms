import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Settings, Shield, Plus, Edit, Trash2 } from 'lucide-react';
import { useWorkflowManagement, type ApprovalWorkflow } from '@/hooks/useWorkflowManagement';

const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'receptionist', label: 'Receptionist' }
];

export const POPermissionManager = () => {
  const { approvalWorkflows, saveApprovalWorkflow, loading } = useWorkflowManagement();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    workflow_name: '',
    min_order_value: 0,
    max_order_value: '',
    required_role: '',
    department: '',
    approval_sequence: 1,
    auto_approve_below_threshold: false,
    notification_emails: '',
    escalation_hours: 24
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const workflow: Omit<ApprovalWorkflow, 'id' | 'created_at' | 'updated_at'> = {
      workflow_name: formData.workflow_name,
      min_order_value: formData.min_order_value,
      max_order_value: formData.max_order_value ? parseFloat(formData.max_order_value) : null,
      required_role: formData.required_role,
      department: formData.department || null,
      approval_sequence: formData.approval_sequence,
      auto_approve_below_threshold: formData.auto_approve_below_threshold,
      notification_emails: formData.notification_emails ? formData.notification_emails.split(',').map(email => email.trim()) : [],
      escalation_hours: formData.escalation_hours,
      is_active: true,
      created_by: null
    };

    const success = await saveApprovalWorkflow(workflow);
    if (success) {
      setIsDialogOpen(false);
      setFormData({
        workflow_name: '',
        min_order_value: 0,
        max_order_value: '',
        required_role: '',
        department: '',
        approval_sequence: 1,
        auto_approve_below_threshold: false,
        notification_emails: '',
        escalation_hours: 24
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'doctor': return 'bg-blue-100 text-blue-800';
      case 'nurse': return 'bg-green-100 text-green-800';
      case 'receptionist': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Purchase Order Permissions</h2>
          <p className="text-muted-foreground">Manage approval workflows and spending limits by role</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Approval Workflow</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workflow_name">Workflow Name</Label>
                  <Input
                    id="workflow_name"
                    value={formData.workflow_name}
                    onChange={(e) => setFormData({ ...formData, workflow_name: e.target.value })}
                    placeholder="e.g., Standard Approval"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="required_role">Required Role</Label>
                  <Select
                    value={formData.required_role}
                    onValueChange={(value) => setFormData({ ...formData, required_role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_order_value">Minimum Order Value</Label>
                  <Input
                    id="min_order_value"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.min_order_value}
                    onChange={(e) => setFormData({ ...formData, min_order_value: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_order_value">Maximum Order Value (Optional)</Label>
                  <Input
                    id="max_order_value"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.max_order_value}
                    onChange={(e) => setFormData({ ...formData, max_order_value: e.target.value })}
                    placeholder="No limit"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department (Optional)</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g., Pharmacy"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="approval_sequence">Approval Sequence</Label>
                  <Input
                    id="approval_sequence"
                    type="number"
                    min="1"
                    value={formData.approval_sequence}
                    onChange={(e) => setFormData({ ...formData, approval_sequence: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notification_emails">Notification Emails (comma-separated)</Label>
                <Input
                  id="notification_emails"
                  value={formData.notification_emails}
                  onChange={(e) => setFormData({ ...formData, notification_emails: e.target.value })}
                  placeholder="admin@clinic.com, manager@clinic.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="escalation_hours">Escalation Hours</Label>
                  <Input
                    id="escalation_hours"
                    type="number"
                    min="1"
                    value={formData.escalation_hours}
                    onChange={(e) => setFormData({ ...formData, escalation_hours: parseInt(e.target.value) || 24 })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto_approve"
                    checked={formData.auto_approve_below_threshold}
                    onCheckedChange={(checked) => setFormData({ ...formData, auto_approve_below_threshold: checked })}
                  />
                  <Label htmlFor="auto_approve">Auto-approve below threshold</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  Create Workflow
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {approvalWorkflows.map((workflow) => (
          <Card key={workflow.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    {workflow.workflow_name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Sequence: {workflow.approval_sequence} • Department: {workflow.department || 'All'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getRoleColor(workflow.required_role)}>
                    {workflow.required_role}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">MIN VALUE</Label>
                  <p className="font-semibold">${workflow.min_order_value.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">MAX VALUE</Label>
                  <p className="font-semibold">
                    {workflow.max_order_value ? `$${workflow.max_order_value.toLocaleString()}` : 'No limit'}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">ESCALATION</Label>
                  <p className="font-semibold">{workflow.escalation_hours}h</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">AUTO-APPROVE</Label>
                  <p className="font-semibold">{workflow.auto_approve_below_threshold ? 'Yes' : 'No'}</p>
                </div>
              </div>

              {workflow.notification_emails.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">NOTIFICATION EMAILS</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {workflow.notification_emails.map((email, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {email}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}

        {approvalWorkflows.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Settings className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Approval Workflows</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create approval workflows to control purchase order permissions based on user roles and order values.
              </p>
              <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create First Workflow
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};