import { PageBody, PageHeader, EmptyState } from "@/components/layout/PageHeader";

export function makeStubScreen(title: string, description: string) {
  return function StubScreen() {
    return (
      <>
        <PageHeader title={title} description={description} />
        <PageBody>
          <EmptyState
            title="Em construção"
            description="Esta tela faz parte do escopo do TimeFlow e será conectada aos mesmos dados que o Dashboard usa. Todo o cálculo é derivado de time_entries."
          />
        </PageBody>
      </>
    );
  };
}

export const ContactsScreen = makeStubScreen("Contatos", "Contatos vinculados a clientes.");
export const CalendarScreen = makeStubScreen("Calendário", "Visão dia/semana/mês de registros e tasks.");
export const InvoicesScreen = makeStubScreen("Invoices", "Gere faturas a partir de time_entries faturáveis.");
export const ReportsScreen = makeStubScreen("Relatórios", "Relatórios filtráveis por cliente, projeto, task e período.");
export const AnalyticsScreen = makeStubScreen("Analytics", "KPIs agregados calculados sobre time_entries.");
export const TeamScreen = makeStubScreen("Equipe", "Members, jornada e metas semanais/mensais.");
export const SettingsScreen = makeStubScreen("Configurações", "Moeda, timezone, valor-hora padrão e formato de data.");
