import { createFileRoute } from "@tanstack/react-router";
import { RequireRole } from "@/lib/auth";
import { TeamScreen } from "@/screens/team/TeamScreen";
export const Route = createFileRoute("/_app/team")({
  component: () => (
    <RequireRole min="manager">
      <TeamScreen />
    </RequireRole>
  ),
});
