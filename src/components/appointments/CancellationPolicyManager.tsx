import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Settings } from 'lucide-react';
import { useCancellationPolicies, type CancellationPolicy } from '@/hooks/useCancellationPolicies';

interface PolicyModalProps {
  policy?: CancellationPolicy;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (policy: Omit<CancellationPolicy, 'id' | 'created_at' | 'updated_at'>) => void;
}

const PolicyModal: React.FC<PolicyModalProps> = ({ policy, open, onOpenChange, onSave }) => {
  const [formData, setFormData] = useState({
    policy_name: policy?.policy_name || '',
    cancellation_window_hours: policy?.cancellation_window_hours || 24,
    late_cancellation_fee: policy?.late_cancellation_fee || 0,
    no_show_fee: policy?.no_show_fee || 0,
    max_no_shows_before_restriction: policy?.max_no_shows_before_restriction || 3,
    restriction_duration_days: policy?.restriction_duration_days || 30,
    auto_restriction_enabled: policy?.auto_restriction_enabled ?? true,
    is_active: policy?.is_active ?? true,
  });

  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{policy ? 'Edit' : 'Create'} Cancellation Policy</DialogTitle>
          <DialogDescription>
            Configure rules for appointment cancellations and no-shows
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="policy_name">Policy Name</Label>
            <Input
              id="policy_name"
              value={formData.policy_name}
              onChange={(e) => setFormData(prev => ({ ...prev, policy_name: e.target.value }))}
              placeholder="e.g., Standard Cancellation Policy"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="cancellation_window">Cancellation Window (hours)</Label>
              <Input
                id="cancellation_window"
                type="number"
                value={formData.cancellation_window_hours}
                onChange={(e) => setFormData(prev => ({ ...prev, cancellation_window_hours: parseInt(e.target.value) || 24 }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="late_fee">Late Cancellation Fee</Label>
              <Input
                id="late_fee"
                type="number"
                step="0.01"
                value={formData.late_cancellation_fee}
                onChange={(e) => setFormData(prev => ({ ...prev, late_cancellation_fee: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="no_show_fee">No-Show Fee</Label>
              <Input
                id="no_show_fee"
                type="number"
                step="0.01"
                value={formData.no_show_fee}
                onChange={(e) => setFormData(prev => ({ ...prev, no_show_fee: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="max_no_shows">Max No-Shows Before Restriction</Label>
              <Input
                id="max_no_shows"
                type="number"
                value={formData.max_no_shows_before_restriction}
                onChange={(e) => setFormData(prev => ({ ...prev, max_no_shows_before_restriction: parseInt(e.target.value) || 3 }))}
              />
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="restriction_duration">Restriction Duration (days)</Label>
            <Input
              id="restriction_duration"
              type="number"
              value={formData.restriction_duration_days}
              onChange={(e) => setFormData(prev => ({ ...prev, restriction_duration_days: parseInt(e.target.value) || 30 }))}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="auto_restriction"
              checked={formData.auto_restriction_enabled}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_restriction_enabled: checked }))}
            />
            <Label htmlFor="auto_restriction">Enable Automatic Restrictions</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="is_active">Policy Active</Label>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {policy ? 'Update' : 'Create'} Policy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const CancellationPolicyManager: React.FC = () => {
  const { policies, loading, createPolicy, updatePolicy, deletePolicy } = useCancellationPolicies();
  const [selectedPolicy, setSelectedPolicy] = useState<CancellationPolicy | undefined>();
  const [showModal, setShowModal] = useState(false);

  const handleCreatePolicy = async (policyData: Omit<CancellationPolicy, 'id' | 'created_at' | 'updated_at'>) => {
    await createPolicy(policyData);
  };

  const handleUpdatePolicy = async (policyData: Omit<CancellationPolicy, 'id' | 'created_at' | 'updated_at'>) => {
    if (selectedPolicy) {
      await updatePolicy(selectedPolicy.id, policyData);
    }
  };

  const handleEdit = (policy: CancellationPolicy) => {
    setSelectedPolicy(policy);
    setShowModal(true);
  };

  const handleCreate = () => {
    setSelectedPolicy(undefined);
    setShowModal(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading cancellation policies...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cancellation Policies</h2>
          <p className="text-muted-foreground">Manage appointment cancellation rules and fees</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Policy
        </Button>
      </div>
      
      <div className="grid gap-4">
        {policies.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Policies Configured</h3>
              <p className="text-muted-foreground mb-4">
                Create your first cancellation policy to manage appointment rules
              </p>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Policy
              </Button>
            </CardContent>
          </Card>
        ) : (
          policies.map(policy => (
            <Card key={policy.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {policy.policy_name}
                      <Badge variant={policy.is_active ? 'default' : 'secondary'}>
                        {policy.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {policy.cancellation_window_hours}h cancellation window • 
                      Max {policy.max_no_shows_before_restriction} no-shows
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(policy)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => deletePolicy(policy.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Late Cancel Fee</p>
                    <p className="text-muted-foreground">${policy.late_cancellation_fee}</p>
                  </div>
                  <div>
                    <p className="font-medium">No-Show Fee</p>
                    <p className="text-muted-foreground">${policy.no_show_fee}</p>
                  </div>
                  <div>
                    <p className="font-medium">Restriction Duration</p>
                    <p className="text-muted-foreground">{policy.restriction_duration_days} days</p>
                  </div>
                  <div>
                    <p className="font-medium">Auto Restrictions</p>
                    <p className="text-muted-foreground">
                      {policy.auto_restriction_enabled ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      <PolicyModal
        policy={selectedPolicy}
        open={showModal}
        onOpenChange={setShowModal}
        onSave={selectedPolicy ? handleUpdatePolicy : handleCreatePolicy}
      />
    </div>
  );
};