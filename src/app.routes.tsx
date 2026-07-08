import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth, RequireRole } from "@/lib/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoadingState } from "@/components/layout/PageHeader";
import { NotFound } from "@/components/NotFound";

// Um import() por tela — mantém o code-splitting por rota que o
// autoCodeSplitting do TanStack Router dava antes da migração (achado 3.3),
// agora explícito já que react-router-dom não faz isso sozinho.
const LoginScreen = lazy(() =>
  import("@/screens/LoginScreen").then((m) => ({ default: m.LoginScreen })),
);
const DashboardScreen = lazy(() =>
  import("@/screens/DashboardScreen").then((m) => ({ default: m.DashboardScreen })),
);
const ClientsScreen = lazy(() =>
  import("@/screens/ClientsScreen").then((m) => ({ default: m.ClientsScreen })),
);
const ContactsScreen = lazy(() =>
  import("@/screens/ContactsScreen").then((m) => ({ default: m.ContactsScreen })),
);
const ProjectsScreen = lazy(() =>
  import("@/screens/ProjectsScreen").then((m) => ({ default: m.ProjectsScreen })),
);
const TasksScreen = lazy(() =>
  import("@/screens/TasksScreen").then((m) => ({ default: m.TasksScreen })),
);
const TimerScreen = lazy(() =>
  import("@/screens/TimerScreen").then((m) => ({ default: m.TimerScreen })),
);
const TimeEntriesScreen = lazy(() =>
  import("@/screens/TimeEntriesScreen").then((m) => ({ default: m.TimeEntriesScreen })),
);
const CalendarScreen = lazy(() =>
  import("@/screens/CalendarScreen").then((m) => ({ default: m.CalendarScreen })),
);
const InvoicesScreen = lazy(() =>
  import("@/screens/InvoicesScreen").then((m) => ({ default: m.InvoicesScreen })),
);
const ReportsScreen = lazy(() =>
  import("@/screens/ReportsScreen").then((m) => ({ default: m.ReportsScreen })),
);
const AnalyticsScreen = lazy(() =>
  import("@/screens/AnalyticsScreen").then((m) => ({ default: m.AnalyticsScreen })),
);
const TeamScreen = lazy(() =>
  import("@/screens/team/TeamScreen").then((m) => ({ default: m.TeamScreen })),
);
const SettingsScreen = lazy(() =>
  import("@/screens/SettingsScreen").then((m) => ({ default: m.SettingsScreen })),
);

export function AppRoutes() {
  return (
    <Suspense fallback={<LoadingState />}>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardScreen />} />
          <Route path="clients" element={<ClientsScreen />} />
          <Route path="contacts" element={<ContactsScreen />} />
          <Route path="projects" element={<ProjectsScreen />} />
          <Route path="tasks" element={<TasksScreen />} />
          <Route path="timer" element={<TimerScreen />} />
          <Route path="time-entries" element={<TimeEntriesScreen />} />
          <Route path="calendar" element={<CalendarScreen />} />
          <Route path="invoices" element={<InvoicesScreen />} />
          <Route
            path="reports"
            element={
              <RequireRole min="manager">
                <ReportsScreen />
              </RequireRole>
            }
          />
          <Route
            path="analytics"
            element={
              <RequireRole min="manager">
                <AnalyticsScreen />
              </RequireRole>
            }
          />
          <Route
            path="team"
            element={
              <RequireRole min="manager">
                <TeamScreen />
              </RequireRole>
            }
          />
          <Route
            path="settings"
            element={
              <RequireRole min="manager">
                <SettingsScreen />
              </RequireRole>
            }
          />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
