import { createFileRoute } from "@tanstack/react-router";
import { RequireRole } from "@/lib/auth";
import { AnalyticsScreen } from "@/screens/AnalyticsScreen";
export const Route = createFileRoute("/_app/analytics")({
  component: () => (
    <RequireRole min="manager">
      <AnalyticsScreen />
    </RequireRole>
  ),
});
