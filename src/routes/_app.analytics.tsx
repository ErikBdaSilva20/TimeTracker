import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsScreen } from "@/screens/AnalyticsScreen";
export const Route = createFileRoute("/_app/analytics")({ component: AnalyticsScreen });
