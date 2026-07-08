import { createFileRoute } from "@tanstack/react-router";
import { ProjectsScreen } from "@/screens/ProjectsScreen";
export const Route = createFileRoute("/_app/projects")({ component: ProjectsScreen });
