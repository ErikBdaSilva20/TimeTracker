import {
  BarChart3,
  Briefcase,
  Building2,
  Calendar,
  Contact,
  FileText,
  LayoutDashboard,
  ListChecks,
  PieChart,
  Play,
  Timer,
  Users,
} from "lucide-react";

/**
 * Estrutura de navegação do sidebar.
 * Centralizada aqui para evitar duplicação e facilitar reordenação/adição
 * de novas rotas sem tocar o componente visual.
 */
export type NavItem = {
  to: string;
  label: string;
  icon: typeof Timer;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Trabalho",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/timer", label: "Timer", icon: Play },
      { to: "/time-entries", label: "Time Entries", icon: Timer },
      { to: "/calendar", label: "Calendário", icon: Calendar },
    ],
  },
  {
    label: "Gestão",
    items: [
      { to: "/clients", label: "Clientes", icon: Building2 },
      { to: "/contacts", label: "Contatos", icon: Contact },
      { to: "/projects", label: "Projetos", icon: Briefcase },
      { to: "/tasks", label: "Tasks", icon: ListChecks },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { to: "/invoices", label: "Invoices", icon: FileText },
      { to: "/reports", label: "Relatórios", icon: BarChart3 },
      { to: "/analytics", label: "Analytics", icon: PieChart },
    ],
  },
  {
    label: "Equipe",
    items: [{ to: "/team", label: "Members", icon: Users }],
  },
];
