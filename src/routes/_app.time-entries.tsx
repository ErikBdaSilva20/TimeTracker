import { createFileRoute } from "@tanstack/react-router";
import { TimeEntriesScreen } from "@/screens/TimeEntriesScreen";
export const Route = createFileRoute("/_app/time-entries")({ component: TimeEntriesScreen });
