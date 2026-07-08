import { createFileRoute } from "@tanstack/react-router";
import { ContactsScreen } from "@/screens/ContactsScreen";
export const Route = createFileRoute("/_app/contacts")({ component: ContactsScreen });
