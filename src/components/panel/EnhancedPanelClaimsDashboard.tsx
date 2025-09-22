import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  FileText, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  Eye,
  Edit,
  Download,
  Upload
} from 'lucide-react';
import { PanelClaimsDashboard } from './PanelClaimsDashboard';
import { PanelClaimsAnalyticsDashboard } from './PanelClaimsAnalyticsDashboard';
import { PanelClaimsWorkflowManager } from './PanelClaimsWorkflowManager';
import { PanelClaimsExportManager } from './PanelClaimsExportManager';
import { ClaimsReconciliationManager } from './ClaimsReconciliationManager';
import { ReconciliationDashboard } from './ReconciliationDashboard';
import { ClaimDocumentsManager } from './ClaimDocumentsManager';
import { ClaimNotesManager } from './ClaimNotesManager';
import { usePanelClaims } from '@/hooks/usePanelClaims';

interface ClaimDetailsModalProps {
  claimId: string;
  isOpen: boolean;
  onClose: () => void;
}

function ClaimDetailsModal({ claimId, isOpen, onClose }: ClaimDetailsModalProps) {
  const [activeTab, setActiveTab] = useState('details');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Claim Details</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">
              <FileText className="h-4 w-4 mr-2" />
              Details
            </TabsTrigger>
            <TabsTrigger value="documents">
              <Upload className="h-4 w-4 mr-2" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="notes">
              <MessageSquare className="h-4 w-4 mr-2" />
              Notes
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4">
            <div className="text-center py-8 text-muted-foreground">
              <p>Claim details view - integrate with existing claim details component</p>
            </div>
          </TabsContent>
          
          <TabsContent value="documents" className="space-y-4">
            <ClaimDocumentsManager claimId={claimId} />
          </TabsContent>
          
          <TabsContent value="notes" className="space-y-4">
            <ClaimNotesManager claimId={claimId} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export function EnhancedPanelClaimsDashboard() {
  const [activeTab, setActiveTab] = useState('claims');
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const { claims } = usePanelClaims();

  const handleViewClaim = (claimId: string) => {
    setSelectedClaimId(claimId);
    setIsClaimModalOpen(true);
  };

  const handleCloseClaimModal = () => {
    setIsClaimModalOpen(false);
    setSelectedClaimId(null);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Panel Claims Management</h1>
          <p className="text-muted-foreground">
            Comprehensive claim management with document handling, notes, and analytics
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="claims" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Claims</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="reconciliation" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Reconciliation</span>
          </TabsTrigger>
          <TabsTrigger value="reconciliation-analytics" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Recon Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="workflow" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Workflow</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Reports</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="claims">
          <PanelClaimsDashboard onViewClaim={handleViewClaim} />
        </TabsContent>

        <TabsContent value="analytics">
          <PanelClaimsAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="reconciliation">
          <ClaimsReconciliationManager />
        </TabsContent>

        <TabsContent value="reconciliation-analytics">
          <ReconciliationDashboard />
        </TabsContent>

        <TabsContent value="workflow">
          <PanelClaimsWorkflowManager />
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Export & Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Export and reporting functionality</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedClaimId && (
        <ClaimDetailsModal
          claimId={selectedClaimId}
          isOpen={isClaimModalOpen}
          onClose={handleCloseClaimModal}
        />
      )}
    </div>
  );
}