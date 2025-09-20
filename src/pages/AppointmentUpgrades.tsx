import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CancellationPolicyManager } from '@/components/appointments/CancellationPolicyManager';
import { PatientReliabilityTracker } from '@/components/appointments/PatientReliabilityTracker';
import { FollowUpCampaignManager } from '@/components/appointments/FollowUpCampaignManager';
import { PreConsultationFormBuilder } from '@/components/appointments/PreConsultationFormBuilder';

export default function AppointmentUpgrades() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Appointment System Upgrades</h1>
        <p className="text-muted-foreground">Advanced appointment management features</p>
      </div>

      <Tabs defaultValue="cancellation" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cancellation">Cancellation Policies</TabsTrigger>
          <TabsTrigger value="reliability">Patient Reliability</TabsTrigger>
          <TabsTrigger value="followup">Follow-Up Campaigns</TabsTrigger>
          <TabsTrigger value="forms">Pre-Consultation Forms</TabsTrigger>
        </TabsList>

        <TabsContent value="cancellation">
          <CancellationPolicyManager />
        </TabsContent>

        <TabsContent value="reliability">
          <PatientReliabilityTracker />
        </TabsContent>

        <TabsContent value="followup">
          <FollowUpCampaignManager />
        </TabsContent>

        <TabsContent value="forms">
          <PreConsultationFormBuilder />
        </TabsContent>
      </Tabs>
    </div>
  );
}