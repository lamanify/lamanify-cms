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
import Billing from "@/pages/Billing";
import Settings from "@/pages/Settings";
import AuthPage from "@/components/auth/AuthPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/patients" element={<AppLayout><Patients /></AppLayout>} />
          <Route path="/queue" element={<AppLayout><Queue /></AppLayout>} />
          <Route path="/display" element={<QueueDisplay />} />
          <Route path="/appointments" element={<AppLayout><Appointments /></AppLayout>} />
          <Route path="/consultations" element={<AppLayout><Consultations /></AppLayout>} />
          <Route path="/billing" element={<AppLayout><Billing /></AppLayout>} />
          <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
