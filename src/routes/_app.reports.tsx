import { createFileRoute } from "@tanstack/react-router";
import { RequireRole } from "@/lib/auth";
import { ReportsScreen } from "@/screens/ReportsScreen";
export const Route = createFileRoute("/_app/reports")({
  component: () => (
    <RequireRole min="manager">
      <ReportsScreen />
    </RequireRole>
  ),
});
