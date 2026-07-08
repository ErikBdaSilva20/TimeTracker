import { createFileRoute } from "@tanstack/react-router";
import { TimerScreen } from "@/screens/TimerScreen";
export const Route = createFileRoute("/_app/timer")({ component: TimerScreen });
