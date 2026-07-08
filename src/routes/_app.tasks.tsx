import { createFileRoute } from "@tanstack/react-router";
import { TasksScreen } from "@/screens/TasksScreen";
export const Route = createFileRoute("/_app/tasks")({ component: TasksScreen });
