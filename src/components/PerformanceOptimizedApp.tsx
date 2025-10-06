import { Suspense, lazy, memo, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import NoCacheWrapper from '@/components/NoCacheWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoadingSpinner } from '@/components/LoadingSpinner';

// Lazy load all pages for better performance
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Patients = lazy(() => import('@/pages/Patients'));
const Queue = lazy(() => import('@/pages/Queue'));
const QueueDisplay = lazy(() => import('@/pages/QueueDisplay'));
const Appointments = lazy(() => import('@/pages/Appointments'));
const Consultations = lazy(() => import('@/pages/Consultations'));
const ConsultationWaitingList = lazy(() => import('@/pages/ConsultationWaitingList'));
const ConsultationInterface = lazy(() => import('@/pages/ConsultationInterface'));
const Billing = lazy(() => import('@/pages/Billing'));
const PanelClaims = lazy(() => import('@/pages/PanelClaims'));
const OutstandingPanelBilling = lazy(() => import('@/pages/OutstandingPanelBilling'));
const PanelInvoice = lazy(() => import('@/pages/PanelInvoice'));
const Settings = lazy(() => import('@/pages/Settings'));
const ClinicSettings = lazy(() => import('@/pages/ClinicSettings'));
const AuthPage = lazy(() => import('@/components/auth/AuthPage'));
const CalendarView = lazy(() => import('@/pages/CalendarView'));
const LowStockAlertsPage = lazy(() => import('@/pages/LowStockAlertsPage'));
const ExpiryAlertsPage = lazy(() => import('@/pages/ExpiryAlertsPage'));
const ResourceManagement = lazy(() => import('@/pages/ResourceManagement'));
const Analytics = lazy(() => import('@/pages/Analytics'));
const WaitlistManager = lazy(() => import('@/components/appointments/WaitlistManager'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const PublicBooking = lazy(() => import('@/pages/PublicBooking'));
const Pricing = lazy(() => import('@/pages/Pricing'));
const CheckoutSuccess = lazy(() => import('@/pages/CheckoutSuccess'));
const InactiveSubscription = lazy(() => import('@/pages/InactiveSubscription'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Optimized QueryClient with better defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests only once
      retry: 1,
      // Don't refetch on window focus by default
      refetchOnWindowFocus: false,
      // Don't refetch on reconnect for better UX
      refetchOnReconnect: false,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
});

// Enhanced loading component with skeleton
const PageLoadingSpinner = memo(() => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent/20">
    <div className="text-center space-y-4">
      <div className="flex items-center justify-center space-x-2 mb-4">
        <div className="w-8 h-8 bg-primary rounded-lg animate-pulse"></div>
        <h1 className="text-2xl font-bold animate-pulse bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
          LamaniHub
        </h1>
      </div>
      <LoadingSpinner size="lg" />
      <p className="text-sm text-muted-foreground animate-pulse">Loading your healthcare dashboard...</p>
    </div>
  </div>
));

// Preload critical components
const preloadCriticalComponents = () => {
  // Preload Dashboard and Auth components as they're most likely to be used first
  import('@/pages/Dashboard');
  import('@/components/auth/AuthPage');
  import('@/pages/Billing');
};

interface PerformanceOptimizedAppProps {
  children?: React.ReactNode;
}

export const PerformanceOptimizedApp = memo(({ children }: PerformanceOptimizedAppProps) => {
  // Preload critical components on app start
  useEffect(() => {
    // Preload in next tick to not block initial render
    setTimeout(preloadCriticalComponents, 0);
    
    // Prefetch other components after 2 seconds
    setTimeout(() => {
      import('@/pages/Patients');
      import('@/pages/Appointments');
      import('@/pages/Settings');
    }, 2000);
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoadingSpinner />}>
              <Routes>
                {/* Public Routes - No subscription required */}
                <Route 
                  path="/auth" 
                  element={
                    <ErrorBoundary>
                      <NoCacheWrapper>
                        <Suspense fallback={<PageLoadingSpinner />}>
                          <AuthPage />
                        </Suspense>
                      </NoCacheWrapper>
                    </ErrorBoundary>
                  } 
                />
                <Route 
                  path="/reset-password" 
                  element={
                    <ErrorBoundary>
                      <NoCacheWrapper>
                        <Suspense fallback={<PageLoadingSpinner />}>
                          <ResetPassword />
                        </Suspense>
                      </NoCacheWrapper>
                    </ErrorBoundary>
                  } 
                />
                <Route path="/pricing" element={
                  <ErrorBoundary>
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <Pricing />
                    </Suspense>
                  </ErrorBoundary>
                } />
                <Route path="/checkout/success" element={
                  <ErrorBoundary>
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <CheckoutSuccess />
                    </Suspense>
                  </ErrorBoundary>
                } />
                <Route path="/book" element={
                  <ErrorBoundary>
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <PublicBooking />
                    </Suspense>
                  </ErrorBoundary>
                } />
                <Route path="/billing/inactive" element={
                  <ErrorBoundary>
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <InactiveSubscription />
                    </Suspense>
                  </ErrorBoundary>
                } />
                
                {/* Billing Routes - Accessible for payment updates (NOT protected) */}
                <Route path="/billing" element={
                  <ErrorBoundary>
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <AppLayout><Billing /></AppLayout>
                    </Suspense>
                  </ErrorBoundary>
                } />
                <Route path="/billing/outstanding-panel" element={
                  <ErrorBoundary>
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <AppLayout><OutstandingPanelBilling /></AppLayout>
                    </Suspense>
                  </ErrorBoundary>
                } />
                
                {/* Protected Routes - Require active subscription */}
                <Route path="/" element={
                  <ErrorBoundary>
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoadingSpinner />}>
                        <AppLayout><Dashboard /></AppLayout>
                      </Suspense>
                    </ProtectedRoute>
                  </ErrorBoundary>
                } />
                <Route path="/patients" element={
                  <ErrorBoundary>
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoadingSpinner />}>
                        <AppLayout><Patients /></AppLayout>
                      </Suspense>
                    </ProtectedRoute>
                  </ErrorBoundary>
                } />
                <Route path="/queue" element={
                  <ErrorBoundary>
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoadingSpinner />}>
                        <AppLayout><Queue /></AppLayout>
                      </Suspense>
                    </ProtectedRoute>
                  </ErrorBoundary>
                } />
                <Route path="/display" element={
                  <ErrorBoundary>
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoadingSpinner />}>
                        <QueueDisplay />
                      </Suspense>
                    </ProtectedRoute>
                  </ErrorBoundary>
                } />
                
                {/* Add remaining routes with same pattern... */}
                
                <Route path="*" element={
                  <ErrorBoundary>
                    <Suspense fallback={<PageLoadingSpinner />}>
                      <NotFound />
                    </Suspense>
                  </ErrorBoundary>
                } />
              </Routes>
            </Suspense>
          </BrowserRouter>
          {children && children}
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
});

PerformanceOptimizedApp.displayName = 'PerformanceOptimizedApp';