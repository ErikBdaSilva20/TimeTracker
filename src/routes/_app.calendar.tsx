import { createFileRoute } from "@tanstack/react-router";
import { CalendarScreen } from "@/screens/CalendarScreen";
export const Route = createFileRoute("/_app/calendar")({ component: CalendarScreen });
