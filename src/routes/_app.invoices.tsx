import { createFileRoute } from "@tanstack/react-router";
import { InvoicesScreen } from "@/screens/InvoicesScreen";
export const Route = createFileRoute("/_app/invoices")({ component: InvoicesScreen });
