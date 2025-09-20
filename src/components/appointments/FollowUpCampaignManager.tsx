import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Calendar, MessageSquare, Clock } from 'lucide-react';
import { useFollowUpCampaigns, type FollowUpCampaign } from '@/hooks/useFollowUpCampaigns';

interface CampaignModalProps {
  campaign?: FollowUpCampaign;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (campaign: Omit<FollowUpCampaign, 'id' | 'created_at' | 'updated_at'>) => void;
}

const CampaignModal: React.FC<CampaignModalProps> = ({ campaign, open, onOpenChange, onSave }) => {
  const [formData, setFormData] = useState({
    campaign_name: campaign?.campaign_name || '',
    trigger_condition: campaign?.trigger_condition || 'appointment_completed' as const,
    trigger_criteria: campaign?.trigger_criteria || {},
    follow_up_days: campaign?.follow_up_days || 7,
    follow_up_type: campaign?.follow_up_type || 'reminder' as const,
    message_template: campaign?.message_template || '',
    appointment_reason: campaign?.appointment_reason || '',
    appointment_duration_minutes: campaign?.appointment_duration_minutes || 30,
    is_active: campaign?.is_active ?? true,
  });

  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{campaign ? 'Edit' : 'Create'} Follow-Up Campaign</DialogTitle>
          <DialogDescription>
            Configure automated follow-up reminders and appointment scheduling
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="campaign_name">Campaign Name</Label>
            <Input
              id="campaign_name"
              value={formData.campaign_name}
              onChange={(e) => setFormData(prev => ({ ...prev, campaign_name: e.target.value }))}
              placeholder="e.g., Post-Consultation Follow-up"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="trigger_condition">Trigger Condition</Label>
              <Select 
                value={formData.trigger_condition}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, trigger_condition: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="appointment_completed">Appointment Completed</SelectItem>
                  <SelectItem value="diagnosis_specific">Diagnosis Specific</SelectItem>
                  <SelectItem value="service_specific">Service Specific</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="follow_up_days">Follow-up Days</Label>
              <Input
                id="follow_up_days"
                type="number"
                value={formData.follow_up_days}
                onChange={(e) => setFormData(prev => ({ ...prev, follow_up_days: parseInt(e.target.value) || 7 }))}
              />
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="follow_up_type">Follow-up Type</Label>
            <Select 
              value={formData.follow_up_type}
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, follow_up_type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reminder">Reminder Only</SelectItem>
                <SelectItem value="appointment">Auto-Schedule Appointment</SelectItem>
                <SelectItem value="both">Reminder + Schedule Option</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="message_template">Message Template</Label>
            <Textarea
              id="message_template"
              value={formData.message_template}
              onChange={(e) => setFormData(prev => ({ ...prev, message_template: e.target.value }))}
              placeholder="Hi {patient_name}, it's time for your follow-up appointment..."
              rows={3}
            />
          </div>
          
          {(formData.follow_up_type === 'appointment' || formData.follow_up_type === 'both') && (
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="appointment_reason">Appointment Reason</Label>
                <Input
                  id="appointment_reason"
                  value={formData.appointment_reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, appointment_reason: e.target.value }))}
                  placeholder="Follow-up consultation"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.appointment_duration_minutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, appointment_duration_minutes: parseInt(e.target.value) || 30 }))}
                />
              </div>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="is_active">Campaign Active</Label>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {campaign ? 'Update' : 'Create'} Campaign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const FollowUpCampaignManager: React.FC = () => {
  const { campaigns, loading, createCampaign, updateCampaign, deleteCampaign } = useFollowUpCampaigns();
  const [selectedCampaign, setSelectedCampaign] = useState<FollowUpCampaign | undefined>();
  const [showModal, setShowModal] = useState(false);

  const handleCreateCampaign = async (campaignData: Omit<FollowUpCampaign, 'id' | 'created_at' | 'updated_at'>) => {
    await createCampaign(campaignData);
  };

  const handleUpdateCampaign = async (campaignData: Omit<FollowUpCampaign, 'id' | 'created_at' | 'updated_at'>) => {
    if (selectedCampaign) {
      await updateCampaign(selectedCampaign.id, campaignData);
    }
  };

  const handleEdit = (campaign: FollowUpCampaign) => {
    setSelectedCampaign(campaign);
    setShowModal(true);
  };

  const handleCreate = () => {
    setSelectedCampaign(undefined);
    setShowModal(true);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="h-4 w-4" />;
      case 'reminder':
        return <MessageSquare className="h-4 w-4" />;
      case 'both':
        return <Clock className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'appointment':
        return 'Auto-Schedule';
      case 'reminder':
        return 'Reminder Only';
      case 'both':
        return 'Reminder + Schedule';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading follow-up campaigns...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Follow-Up Campaigns</h2>
          <p className="text-muted-foreground">Automate follow-up reminders and appointment scheduling</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Campaign
        </Button>
      </div>
      
      <div className="grid gap-4">
        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Campaigns Configured</h3>
              <p className="text-muted-foreground mb-4">
                Create automated follow-up campaigns to improve patient care continuity
              </p>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Campaign
              </Button>
            </CardContent>
          </Card>
        ) : (
          campaigns.map(campaign => (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {getTypeIcon(campaign.follow_up_type)}
                      {campaign.campaign_name}
                      <Badge variant={campaign.is_active ? 'default' : 'secondary'}>
                        {campaign.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Triggers after {campaign.follow_up_days} days • {getTypeLabel(campaign.follow_up_type)}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(campaign)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => deleteCampaign(campaign.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-1">Trigger Condition</p>
                    <Badge variant="outline">{campaign.trigger_condition.replace('_', ' ')}</Badge>
                  </div>
                  
                  {campaign.message_template && (
                    <div>
                      <p className="text-sm font-medium mb-1">Message Template</p>
                      <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                        {campaign.message_template.length > 100 
                          ? campaign.message_template.substring(0, 100) + '...'
                          : campaign.message_template
                        }
                      </p>
                    </div>
                  )}
                  
                  {campaign.appointment_reason && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Appointment Reason</p>
                        <p className="text-muted-foreground">{campaign.appointment_reason}</p>
                      </div>
                      <div>
                        <p className="font-medium">Duration</p>
                        <p className="text-muted-foreground">{campaign.appointment_duration_minutes} minutes</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      <CampaignModal
        campaign={selectedCampaign}
        open={showModal}
        onOpenChange={setShowModal}
        onSave={selectedCampaign ? handleUpdateCampaign : handleCreateCampaign}
      />
    </div>
  );
};