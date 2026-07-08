import { createFileRoute } from "@tanstack/react-router";
import { ClientsScreen } from "@/screens/ClientsScreen";
export const Route = createFileRoute("/_app/clients")({ component: ClientsScreen });
