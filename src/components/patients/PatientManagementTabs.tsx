import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PatientListTab } from './PatientListTab';
import { PatientAnalyticsTab } from './PatientAnalyticsTab';

export function PatientManagementTabs() {
  return (
    <div className="flex flex-col h-full">
      <Tabs defaultValue="list" className="flex flex-col h-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="list">Patient List</TabsTrigger>
          <TabsTrigger value="analytics">Analytics & Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="flex-1 mt-0">
          <PatientListTab />
        </TabsContent>
        
        <TabsContent value="analytics" className="flex-1 mt-0">
          <PatientAnalyticsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}