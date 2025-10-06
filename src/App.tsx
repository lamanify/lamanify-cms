import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Patients from "@/pages/Patients";
import Queue from "@/pages/Queue";
import QueueDisplay from "@/pages/QueueDisplay";
import Appointments from "@/pages/Appointments";
import Consultations from "@/pages/Consultations";
import ConsultationWaitingList from "@/pages/ConsultationWaitingList";
import ConsultationInterface from "@/pages/ConsultationInterface";
import Billing from "@/pages/Billing";
import PanelClaims from "@/pages/PanelClaims";
import OutstandingPanelBilling from "@/pages/OutstandingPanelBilling";
import PanelInvoice from "@/pages/PanelInvoice";
import Settings from "@/pages/Settings";
import ClinicSettings from '@/pages/ClinicSettings';
import AuthPage from "@/components/auth/AuthPage";
import CalendarView from "@/pages/CalendarView";
import LowStockAlertsPage from "@/pages/LowStockAlertsPage";
import ExpiryAlertsPage from "@/pages/ExpiryAlertsPage";
import ResourceManagement from "@/pages/ResourceManagement";
import Analytics from "@/pages/Analytics";
import { WaitlistManager } from "@/components/appointments/WaitlistManager";
import ResetPassword from "@/pages/ResetPassword";
import PublicBooking from "@/pages/PublicBooking";
import Pricing from "@/pages/Pricing";
import CheckoutSuccess from "@/pages/CheckoutSuccess";
import InactiveSubscription from "@/pages/InactiveSubscription";
import NotFound from "./pages/NotFound";
import NoCacheWrapper from "@/components/NoCacheWrapper";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes - No subscription required */}
          <Route 
            path="/auth" 
            element={
              <NoCacheWrapper>
                <AuthPage />
              </NoCacheWrapper>
            } 
          />
          <Route 
            path="/reset-password" 
            element={
              <NoCacheWrapper>
                <ResetPassword />
              </NoCacheWrapper>
            } 
          />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/book" element={<PublicBooking />} />
          <Route path="/billing/inactive" element={<InactiveSubscription />} />
          
          {/* Billing Routes - Accessible for payment updates (NOT protected) */}
          <Route path="/billing" element={<AppLayout><Billing /></AppLayout>} />
          <Route path="/billing/outstanding-panel" element={<AppLayout><OutstandingPanelBilling /></AppLayout>} />
          
          {/* Protected Routes - Require active subscription */}
          <Route path="/" element={
            <ProtectedRoute>
              <AppLayout><Dashboard /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/patients" element={
            <ProtectedRoute>
              <AppLayout><Patients /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/queue" element={
            <ProtectedRoute>
              <AppLayout><Queue /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/display" element={
            <ProtectedRoute>
              <QueueDisplay />
            </ProtectedRoute>
          } />
          <Route path="/appointments" element={
            <ProtectedRoute>
              <AppLayout><Appointments /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/appointments/calendar" element={
            <ProtectedRoute>
              <AppLayout><CalendarView /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/appointments/waitlist" element={
            <ProtectedRoute>
              <AppLayout><WaitlistManager /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/resources" element={
            <ProtectedRoute>
              <AppLayout><ResourceManagement /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/consultations" element={
            <ProtectedRoute>
              <AppLayout><Consultations /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/consultation/:sessionId" element={
            <ProtectedRoute>
              <AppLayout><ConsultationInterface /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/panel/invoice" element={
            <ProtectedRoute>
              <AppLayout><PanelInvoice /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/panel-claims" element={
            <ProtectedRoute>
              <AppLayout><PanelClaims /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <AppLayout><Settings /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/settings/clinic" element={
            <ProtectedRoute>
              <AppLayout><ClinicSettings /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/inventory/alerts/low-stock" element={
            <ProtectedRoute>
              <AppLayout><LowStockAlertsPage /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/inventory/alerts/expiry" element={
            <ProtectedRoute>
              <AppLayout><ExpiryAlertsPage /></AppLayout>
            </ProtectedRoute>
          } />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;