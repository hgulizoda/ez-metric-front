import { Suspense, lazy, type ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { useAuthStore } from "@/app/store/authStore";
import { MainLayout } from "@/layouts/MainLayout";

// Lazy-loaded pages
const LoginPage = lazy(() => import("@/pages/Auth/LoginPage"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const Employees = lazy(() => import("@/pages/Employees"));
const EmployeeDetail = lazy(() => import("@/pages/Employees/EmployeeDetail"));
const Punches = lazy(() => import("@/pages/Punches"));
const PunchDetail = lazy(() => import("@/pages/Punches/PunchDetail"));
const Shifts = lazy(() => import("@/pages/Shifts"));
const Salary = lazy(() => import("@/pages/Salary"));
const Efficiency = lazy(() => import("@/pages/Efficiency"));
const Reports = lazy(() => import("@/pages/Reports"));
const ReportDetail = lazy(() => import("@/pages/Reports/ReportDetail"));
const Devices = lazy(() => import("@/pages/Devices"));
const ShiftTypes = lazy(() => import("@/pages/ShiftTypes"));
const DepartmentsPage = lazy(() => import("@/pages/Departments"));
const JobsPage = lazy(() => import("@/pages/Jobs"));
const Settings = lazy(() => import("@/pages/Settings"));
const Profile = lazy(() => import("@/pages/Profile"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[300px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Suspense fallback={<PageLoader />}>
                <LoginPage />
              </Suspense>
            )
          }
        />

        {/* Protected routes inside MainLayout */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/employees" element={<Employees />} />
                    <Route path="/employees/:id" element={<EmployeeDetail />} />
                    <Route path="/punches" element={<Punches />} />
                    <Route path="/punches/:id" element={<PunchDetail />} />
                    <Route path="/shifts" element={<Shifts />} />
                    <Route path="/salary" element={<Salary />} />
                    <Route path="/efficiency" element={<Efficiency />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/reports/:reportId" element={<ReportDetail />} />
                    <Route path="/devices" element={<Devices />} />
                    <Route path="/shift-types" element={<ShiftTypes />} />
                    <Route path="/departments" element={<DepartmentsPage />} />
                    <Route path="/jobs" element={<JobsPage />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route
                      path="/"
                      element={<Navigate to="/dashboard" replace />}
                    />
                    <Route
                      path="*"
                      element={<Navigate to="/dashboard" replace />}
                    />
                  </Routes>
                </Suspense>
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <Notifications position="top-right" zIndex={9999} />
        <AppRoutes />
      </MantineProvider>
    </QueryClientProvider>
  );
}
