import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, TrendingUp, RefreshCw, Package, CheckCircle, X, ShoppingCart } from 'lucide-react';
import { useWorkflowManagement, type ReorderSuggestion } from '@/hooks/useWorkflowManagement';

const priorityConfig = {
  urgent: { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle },
  high: { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: TrendingUp },
  normal: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Package },
  low: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Package }
};

const statusConfig = {
  pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending Review' },
  approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
  ordered: { color: 'bg-blue-100 text-blue-800', label: 'Ordered' },
  dismissed: { color: 'bg-gray-100 text-gray-800', label: 'Dismissed' }
};

export const ReorderSuggestionEngine = () => {
  const { reorderSuggestions, updateSuggestionStatus, generateReorderSuggestions, loading } = useWorkflowManagement();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleStatusUpdate = async (suggestionId: string, status: ReorderSuggestion['status']) => {
    setProcessingId(suggestionId);
    await updateSuggestionStatus(suggestionId, status);
    setProcessingId(null);
  };

  const handleGenerateSuggestions = async () => {
    await generateReorderSuggestions();
  };

  const groupedSuggestions = reorderSuggestions.reduce((acc, suggestion) => {
    if (!acc[suggestion.priority_level]) {
      acc[suggestion.priority_level] = [];
    }
    acc[suggestion.priority_level].push(suggestion);
    return acc;
  }, {} as Record<string, ReorderSuggestion[]>);

  const priorityOrder: (keyof typeof priorityConfig)[] = ['urgent', 'high', 'normal', 'low'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Reorder Suggestions</h2>
          <p className="text-muted-foreground">AI-powered inventory replenishment recommendations</p>
        </div>
        <Button onClick={handleGenerateSuggestions} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Generate Suggestions
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {priorityOrder.map((priority) => {
          const suggestions = groupedSuggestions[priority] || [];
          const config = priorityConfig[priority];
          const Icon = config.icon;
          
          return (
            <Card key={priority}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{suggestions.length}</p>
                    <p className="text-sm text-muted-foreground capitalize">{priority} Priority</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Suggestions by Priority */}
      <div className="space-y-6">
        {priorityOrder.map((priority) => {
          const suggestions = groupedSuggestions[priority] || [];
          if (suggestions.length === 0) return null;

          const config = priorityConfig[priority];
          const Icon = config.icon;

          return (
            <div key={priority} className="space-y-4">
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5" />
                <h3 className="text-lg font-semibold capitalize">{priority} Priority</h3>
                <Badge className={config.color}>{suggestions.length} items</Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {suggestions.map((suggestion) => (
                  <Card key={suggestion.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{suggestion.medication_name}</CardTitle>
                          <CardDescription>
                            Current: {suggestion.current_stock} units
                          </CardDescription>
                        </div>
                        <Badge className={statusConfig[suggestion.status].color}>
                          {statusConfig[suggestion.status].label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Suggested Qty</p>
                          <p className="font-semibold">{suggestion.suggested_quantity}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Est. Cost</p>
                          <p className="font-semibold">
                            ${suggestion.cost_estimate?.toLocaleString() || 'N/A'}
                          </p>
                        </div>
                      </div>

                      {suggestion.average_consumption_daily && (
                        <div className="text-sm">
                          <p className="text-muted-foreground">Daily Usage</p>
                          <p className="font-semibold">{suggestion.average_consumption_daily.toFixed(1)} units</p>
                        </div>
                      )}

                      <div className="text-sm">
                        <p className="text-muted-foreground">Reason</p>
                        <p className="capitalize">{suggestion.reason?.replace('_', ' ') || 'Low stock'}</p>
                      </div>

                      {suggestion.supplier_name && (
                        <div className="text-sm">
                          <p className="text-muted-foreground">Suggested Supplier</p>
                          <p className="font-semibold">{suggestion.supplier_name}</p>
                        </div>
                      )}

                      <Separator />

                      {suggestion.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 gap-1"
                            onClick={() => handleStatusUpdate(suggestion.id, 'approved')}
                            disabled={processingId === suggestion.id}
                          >
                            <CheckCircle className="h-3 w-3" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 gap-1"
                            onClick={() => handleStatusUpdate(suggestion.id, 'dismissed')}
                            disabled={processingId === suggestion.id}
                          >
                            <X className="h-3 w-3" />
                            Dismiss
                          </Button>
                        </div>
                      )}

                      {suggestion.status === 'approved' && (
                        <Button
                          size="sm"
                          className="w-full gap-1"
                          onClick={() => handleStatusUpdate(suggestion.id, 'ordered')}
                          disabled={processingId === suggestion.id}
                        >
                          <ShoppingCart className="h-3 w-3" />
                          Create PO
                        </Button>
                      )}

                      {suggestion.status === 'ordered' && (
                        <div className="text-center text-sm text-muted-foreground">
                          Order has been placed
                        </div>
                      )}

                      {suggestion.status === 'dismissed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full gap-1"
                          onClick={() => handleStatusUpdate(suggestion.id, 'pending')}
                          disabled={processingId === suggestion.id}
                        >
                          <RefreshCw className="h-3 w-3" />
                          Reactivate
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {reorderSuggestions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Reorder Suggestions</h3>
            <p className="text-muted-foreground text-center mb-4">
              Generate AI-powered reorder suggestions based on inventory levels and consumption patterns.
            </p>
            <Button onClick={handleGenerateSuggestions} disabled={loading} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Generate First Suggestions
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};