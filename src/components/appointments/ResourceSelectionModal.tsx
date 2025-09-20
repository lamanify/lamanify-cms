import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { MapPin, Monitor, Stethoscope } from 'lucide-react';
import { useResources } from '@/hooks/useResources';

interface ResourceSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedResources: string[];
  onResourcesChange: (resourceIds: string[]) => void;
  appointmentDate?: string;
  appointmentTime?: string;
  durationMinutes?: number;
  excludeAppointmentId?: string;
}

export function ResourceSelectionModal({
  open,
  onOpenChange,
  selectedResources,
  onResourcesChange,
  appointmentDate,
  appointmentTime,
  durationMinutes,
  excludeAppointmentId
}: ResourceSelectionModalProps) {
  const { resources, loading, checkResourceAvailability } = useResources();
  const [availabilityCache, setAvailabilityCache] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (open && appointmentDate && appointmentTime && durationMinutes) {
      // Check availability for all resources
      const checkAll = async () => {
        const cache: Record<string, boolean> = {};
        for (const resource of resources) {
          const available = await checkResourceAvailability(
            resource.id,
            appointmentDate,
            appointmentTime,
            durationMinutes,
            excludeAppointmentId
          );
          cache[resource.id] = available;
        }
        setAvailabilityCache(cache);
      };
      checkAll();
    }
  }, [open, resources, appointmentDate, appointmentTime, durationMinutes, excludeAppointmentId]);

  const handleResourceToggle = (resourceId: string, checked: boolean) => {
    if (checked) {
      onResourcesChange([...selectedResources, resourceId]);
    } else {
      onResourcesChange(selectedResources.filter(id => id !== resourceId));
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'room':
        return <MapPin className="h-4 w-4" />;
      case 'equipment':
        return <Monitor className="h-4 w-4" />;
      case 'device':
        return <Stethoscope className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const groupedResources = resources.reduce((acc, resource) => {
    if (!acc[resource.type]) {
      acc[resource.type] = [];
    }
    acc[resource.type].push(resource);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Select Resources
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center">Loading resources...</div>
        ) : (
          <div className="space-y-6 max-h-96 overflow-y-auto">
            {Object.entries(groupedResources).map(([type, typeResources]) => (
              <div key={type} className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  {type}s
                </h3>
                <div className="grid gap-2">
                  {(typeResources as any[]).map((resource) => {
                    const isSelected = selectedResources.includes(resource.id);
                    const isAvailable = availabilityCache[resource.id] ?? true;
                    
                    return (
                      <div
                        key={resource.id}
                        className={`flex items-center space-x-3 p-3 border rounded-lg ${
                          !isAvailable ? 'bg-muted opacity-60' : 'hover:bg-muted/50'
                        }`}
                      >
                        <Checkbox
                          id={resource.id}
                          checked={isSelected}
                          disabled={!isAvailable}
                          onCheckedChange={(checked) => 
                            handleResourceToggle(resource.id, checked as boolean)
                          }
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {getResourceIcon(resource.type)}
                            <Label 
                              htmlFor={resource.id}
                              className={`font-medium ${!isAvailable ? 'text-muted-foreground' : ''}`}
                            >
                              {resource.name}
                            </Label>
                            {!isAvailable && (
                              <Badge variant="secondary" className="text-xs">
                                Unavailable
                              </Badge>
                            )}
                          </div>
                          {resource.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {resource.description}
                            </p>
                          )}
                          {resource.location && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Location: {resource.location}
                            </p>
                          )}
                        </div>
                        {resource.capacity > 1 && (
                          <Badge variant="outline">
                            Capacity: {resource.capacity}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 justify-end mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Confirm Selection ({selectedResources.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}