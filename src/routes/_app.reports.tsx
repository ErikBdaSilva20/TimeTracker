import { createFileRoute } from "@tanstack/react-router";
import { ReportsScreen } from "@/screens/ReportsScreen";
export const Route = createFileRoute("/_app/reports")({ component: ReportsScreen });
