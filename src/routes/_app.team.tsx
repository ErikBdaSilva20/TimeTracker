import { createFileRoute } from "@tanstack/react-router";
import { TeamScreen } from "@/screens/team/TeamScreen";
export const Route = createFileRoute("/_app/team")({ component: TeamScreen });
