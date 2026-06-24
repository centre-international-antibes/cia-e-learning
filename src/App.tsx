import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { ErrorBoundary } from '@/components/states/ErrorBoundary';
import Index from './pages/Index';

// All non-landing routes are code-split — chunked on demand.
const Catalogue = lazy(() => import('./pages/Catalogue'));
const Curriculum = lazy(() => import('./pages/Curriculum'));
const Glossaire = lazy(() => import('./pages/Glossaire'));
const Connexion = lazy(() => import('./pages/Connexion'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const TestNiveau = lazy(() => import('./pages/TestNiveau'));
const Classement = lazy(() => import('./pages/Classement'));
const SpeedTest = lazy(() => import('./pages/SpeedTest'));
const DailyChallenge = lazy(() => import('./pages/DailyChallenge'));
const Profil = lazy(() => import('./pages/Profil'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Abonnement = lazy(() => import('./pages/Abonnement'));
const ContactCia = lazy(() => import('./pages/ContactCia'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Admin bundle (recharts + 6 admin pages) — split from the user-facing bundle.
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminCourses = lazy(() => import('./pages/admin/AdminCourses'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminSubscriptions = lazy(() => import('./pages/admin/AdminSubscriptions'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));

const queryClient = new QueryClient();

function RouteFallback() {
  return (
    <div
      className="flex min-h-[60vh] w-full items-center justify-center"
      role="status"
      aria-live="polite"
      aria-label="Chargement"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

/** Root route: shows the public landing for visitors, redirects authenticated
 *  users to their dashboard so `/` becomes an "open the app" URL. */
function LandingOrRedirect() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    if (!isLoading && user) {
      navigate('/dashboard' + location.search, { replace: true });
    }
  }, [isLoading, user, navigate, location.search]);
  if (isLoading || user) return <RouteFallback />;
  return <Index />;
}

/** Wraps a route that requires authentication. */
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (!isLoading && !user) {
      const next = encodeURIComponent(location.pathname + location.search);
      navigate(`/connexion?redirect=${next}`, { replace: true });
    }
  }, [isLoading, user, navigate, location.pathname, location.search]);
  if (isLoading || !user) return <RouteFallback />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                {/* Front-office */}
                <Route element={<AppLayout />}>
                  <Route path="/" element={<LandingOrRedirect />} />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/catalogue" element={<Catalogue />} />
                  <Route path="/programme" element={<Curriculum />} />
                  <Route path="/glossaire" element={<Glossaire />} />
                  <Route path="/cours/:id" element={<CourseDetail />} />
                  <Route path="/test-niveau" element={<TestNiveau />} />
                  <Route path="/classement" element={<Classement />} />
                  <Route path="/test-vitesse/:level" element={<SpeedTest />} />
                  <Route path="/defi-du-jour" element={<DailyChallenge />} />
                  <Route path="/connexion" element={<Connexion />} />
                  <Route path="/inscription" element={<Connexion />} />
                  <Route path="/profil" element={<Profil />} />
                  <Route path="/mot-de-passe-oublie" element={<ForgotPassword />} />
                  <Route path="/reinitialiser-mot-de-passe" element={<ResetPassword />} />
                  <Route path="/favoris" element={<Catalogue />} />
                  <Route
                    path="/abonnement"
                    element={
                      <ProtectedRoute>
                        <Abonnement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/contact-cia"
                    element={
                      <ProtectedRoute>
                        <ContactCia />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                {/* Back-office admin */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="utilisateurs" element={<AdminUsers />} />
                  <Route path="cours" element={<AdminCourses />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="abonnements" element={<AdminSubscriptions />} />
                  <Route path="parametres" element={<AdminSettings />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
