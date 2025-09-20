import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Sidebar, SidebarContent, SidebarHeader, SidebarTrigger } from '@/components/ui/sidebar';
import { X, Users, Activity, DollarSign, FilterX } from 'lucide-react';

interface FilterCriteria {
  searchTerm: string;
  ageRange: [number, number];
  gender: string;
  visitFrequency: string;
  dateRange: {
    start: string;
    end: string;
  };
  diagnosis: string;
  amountSpentRange: [number, number];
}

interface FilterSidebarProps {
  filters: FilterCriteria;
  onFiltersChange: (filters: FilterCriteria) => void;
  patientCount: number;
  totalPatients: number;
}

export function FilterSidebar({ filters, onFiltersChange, patientCount, totalPatients }: FilterSidebarProps) {
  const [localFilters, setLocalFilters] = useState(filters);

  const updateFilter = (key: keyof FilterCriteria, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters: FilterCriteria = {
      searchTerm: '',
      ageRange: [0, 120],
      gender: 'all',
      visitFrequency: 'all',
      dateRange: { start: '', end: '' },
      diagnosis: '',
      amountSpentRange: [0, 100000]
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const activeFiltersCount = Object.entries(localFilters).filter(([key, value]) => {
    if (key === 'searchTerm') return value !== '';
    if (key === 'ageRange') return value[0] !== 0 || value[1] !== 120;
    if (key === 'diagnosis') return value !== '';
    if (key === 'gender') return value !== '' && value !== 'all';
    if (key === 'visitFrequency') return value !== '' && value !== 'all';
    if (key === 'amountSpentRange') return value[0] !== 0 || value[1] !== 100000;
    return false;
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
    <Sidebar className="w-80" side="right">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Advanced Filters</h3>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">
                {activeFiltersCount} active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <FilterX className="h-4 w-4 mr-1" />
              Clear All
            </Button>
            <SidebarTrigger />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4 space-y-6">
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
              <Select value={localFilters.gender} onValueChange={(value) => updateFilter('gender', value)}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {genderOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Select value={localFilters.visitFrequency} onValueChange={(value) => updateFilter('visitFrequency', value)}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {visitFrequencyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium text-muted-foreground">Date Range</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Input
                  type="date"
                  placeholder="From"
                  value={localFilters.dateRange.start}
                  onChange={(e) => updateFilter('dateRange', { 
                    ...localFilters.dateRange, 
                    start: e.target.value 
                  })}
                  className="text-xs"
                />
                <Input
                  type="date"
                  placeholder="To"
                  value={localFilters.dateRange.end}
                  onChange={(e) => updateFilter('dateRange', { 
                    ...localFilters.dateRange, 
                    end: e.target.value 
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
              <Label className="text-xs font-medium text-muted-foreground">Amount Spent Range</Label>
              <div className="px-2 py-4">
                <Slider
                  value={localFilters.amountSpentRange}
                  onValueChange={(value) => updateFilter('amountSpentRange', value)}
                  max={100000}
                  min={0}
                  step={100}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>${localFilters.amountSpentRange[0]}</span>
                  <span>${localFilters.amountSpentRange[1]}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Filters Summary */}
        {activeFiltersCount > 0 && (
          <div>
            <Separator className="mb-4" />
            <div className="space-y-3">
              <span className="text-sm font-medium text-muted-foreground">Active filters:</span>
              <div className="flex flex-col gap-2">
                {(localFilters.ageRange[0] !== 0 || localFilters.ageRange[1] !== 120) && (
                  <Badge variant="outline" className="justify-between">
                    Age: {localFilters.ageRange[0]}-{localFilters.ageRange[1]}
                    <X 
                      className="h-3 w-3 cursor-pointer ml-2" 
                      onClick={() => updateFilter('ageRange', [0, 120])}
                    />
                  </Badge>
                )}
                {localFilters.gender && localFilters.gender !== 'all' && (
                  <Badge variant="outline" className="justify-between">
                    Gender: {localFilters.gender}
                    <X 
                      className="h-3 w-3 cursor-pointer ml-2" 
                      onClick={() => updateFilter('gender', 'all')}
                    />
                  </Badge>
                )}
                {localFilters.visitFrequency && localFilters.visitFrequency !== 'all' && (
                  <Badge variant="outline" className="justify-between">
                    Frequency: {localFilters.visitFrequency}
                    <X 
                      className="h-3 w-3 cursor-pointer ml-2" 
                      onClick={() => updateFilter('visitFrequency', 'all')}
                    />
                  </Badge>
                )}
                {localFilters.diagnosis && (
                  <Badge variant="outline" className="justify-between">
                    Diagnosis: "{localFilters.diagnosis}"
                    <X 
                      className="h-3 w-3 cursor-pointer ml-2" 
                      onClick={() => updateFilter('diagnosis', '')}
                    />
                  </Badge>
                )}
                {(localFilters.amountSpentRange[0] !== 0 || localFilters.amountSpentRange[1] !== 100000) && (
                  <Badge variant="outline" className="justify-between">
                    Amount: ${localFilters.amountSpentRange[0]}-${localFilters.amountSpentRange[1]}
                    <X 
                      className="h-3 w-3 cursor-pointer ml-2" 
                      onClick={() => updateFilter('amountSpentRange', [0, 100000])}
                    />
                  </Badge>
                )}
                <Badge variant="secondary" className="justify-center">
                  Showing {patientCount} of {totalPatients} patients
                </Badge>
              </div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}