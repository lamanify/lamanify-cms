import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FilterCriteria } from './UnifiedPatientHub';
import { Search, X, Calendar, Users, Activity, DollarSign } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface AdvancedFilterPanelProps {
  filters: FilterCriteria;
  onFiltersChange: (filters: FilterCriteria) => void;
  patients: any[]; // For getting available options
}

export function AdvancedFilterPanel({ filters, onFiltersChange, patients }: AdvancedFilterPanelProps) {
  const [localFilters, setLocalFilters] = useState(filters);

  const updateFilter = (key: keyof FilterCriteria, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters: FilterCriteria = {
      search: '',
      ageRange: [0, 120],
      gender: [],
      registrationDate: {},
      lastVisitDate: {},
      diagnosis: '',
      tags: [],
      tier: [],
      paymentStatus: [],
      visitFrequency: []
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const activeFiltersCount = Object.entries(localFilters).filter(([key, value]) => {
    if (key === 'search') return value !== '';
    if (key === 'ageRange') return value[0] !== 0 || value[1] !== 120;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
    return value !== '';
  }).length;

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' }
  ];

  const visitFrequencyOptions = [
    { value: 'new', label: 'New Patients' },
    { value: 'regular', label: 'Regular Visitors' },
    { value: 'frequent', label: 'Frequent Visitors' },
    { value: 'inactive', label: 'Inactive Patients' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Advanced Filters</h3>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount} active
            </Badge>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />
          Clear All
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Search */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Name, ID, phone, email..."
              value={localFilters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Demographics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Demographics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Age Range</Label>
              <div className="px-2 py-4">
                <Slider
                  value={localFilters.ageRange}
                  onValueChange={(value) => updateFilter('ageRange', value)}
                  max={120}
                  min={0}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{localFilters.ageRange[0]}</span>
                  <span>{localFilters.ageRange[1]}</span>
                </div>
              </div>
            </div>
            
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Gender</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {genderOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`gender-${option.value}`}
                      checked={localFilters.gender.includes(option.value)}
                      onCheckedChange={(checked) => {
                        const newGenders = checked
                          ? [...localFilters.gender, option.value]
                          : localFilters.gender.filter(g => g !== option.value);
                        updateFilter('gender', newGenders);
                      }}
                    />
                    <Label htmlFor={`gender-${option.value}`} className="text-xs">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visit History */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Visit History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Visit Frequency</Label>
              <div className="space-y-2 mt-2">
                {visitFrequencyOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`frequency-${option.value}`}
                      checked={localFilters.visitFrequency.includes(option.value)}
                      onCheckedChange={(checked) => {
                        const newFrequencies = checked
                          ? [...localFilters.visitFrequency, option.value]
                          : localFilters.visitFrequency.filter(f => f !== option.value);
                        updateFilter('visitFrequency', newFrequencies);
                      }}
                    />
                    <Label htmlFor={`frequency-${option.value}`} className="text-xs">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium text-muted-foreground">Last Visit Date</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Input
                  type="date"
                  placeholder="From"
                  value={localFilters.lastVisitDate.from || ''}
                  onChange={(e) => updateFilter('lastVisitDate', { 
                    ...localFilters.lastVisitDate, 
                    from: e.target.value 
                  })}
                  className="text-xs"
                />
                <Input
                  type="date"
                  placeholder="To"
                  value={localFilters.lastVisitDate.to || ''}
                  onChange={(e) => updateFilter('lastVisitDate', { 
                    ...localFilters.lastVisitDate, 
                    to: e.target.value 
                  })}
                  className="text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medical & Financial */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Medical & Financial
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Diagnosis Keywords</Label>
              <Input
                placeholder="Search diagnosis..."
                value={localFilters.diagnosis}
                onChange={(e) => updateFilter('diagnosis', e.target.value)}
                className="mt-2"
              />
            </div>
            
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Payment Status</Label>
              <div className="space-y-2 mt-2">
                {['paid', 'pending', 'partial', 'overdue'].map((status) => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox
                      id={`payment-${status}`}
                      checked={localFilters.paymentStatus.includes(status)}
                      onCheckedChange={(checked) => {
                        const newStatuses = checked
                          ? [...localFilters.paymentStatus, status]
                          : localFilters.paymentStatus.filter(s => s !== status);
                        updateFilter('paymentStatus', newStatuses);
                      }}
                    />
                    <Label htmlFor={`payment-${status}`} className="text-xs capitalize">
                      {status}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium text-muted-foreground">Registration Date</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Input
                  type="date"
                  placeholder="From"
                  value={localFilters.registrationDate.from || ''}
                  onChange={(e) => updateFilter('registrationDate', { 
                    ...localFilters.registrationDate, 
                    from: e.target.value 
                  })}
                  className="text-xs"
                />
                <Input
                  type="date"
                  placeholder="To"
                  value={localFilters.registrationDate.to || ''}
                  onChange={(e) => updateFilter('registrationDate', { 
                    ...localFilters.registrationDate, 
                    to: e.target.value 
                  })}
                  className="text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Filters Summary */}
      {activeFiltersCount > 0 && (
        <div className="mt-4">
          <Separator className="mb-4" />
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-muted-foreground">Active filters:</span>
            {localFilters.search && (
              <Badge variant="outline" className="gap-1">
                Search: "{localFilters.search}"
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('search', '')}
                />
              </Badge>
            )}
            {(localFilters.ageRange[0] !== 0 || localFilters.ageRange[1] !== 120) && (
              <Badge variant="outline" className="gap-1">
                Age: {localFilters.ageRange[0]}-{localFilters.ageRange[1]}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('ageRange', [0, 120])}
                />
              </Badge>
            )}
            {localFilters.gender.map(gender => (
              <Badge key={gender} variant="outline" className="gap-1">
                {gender}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('gender', localFilters.gender.filter(g => g !== gender))}
                />
              </Badge>
            ))}
            {localFilters.visitFrequency.map(freq => (
              <Badge key={freq} variant="outline" className="gap-1">
                {freq}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('visitFrequency', localFilters.visitFrequency.filter(f => f !== freq))}
                />
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}