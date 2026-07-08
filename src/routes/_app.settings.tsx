import { createFileRoute } from "@tanstack/react-router";
import { SettingsScreen } from "@/screens/stubs";
export const Route = createFileRoute("/_app/settings")({ component: SettingsScreen });
