import { createFileRoute } from "@tanstack/react-router";
import { RequireRole } from "@/lib/auth";
import { SettingsScreen } from "@/screens/SettingsScreen";
export const Route = createFileRoute("/_app/settings")({
  component: () => (
    <RequireRole min="manager">
      <SettingsScreen />
    </RequireRole>
  ),
});
