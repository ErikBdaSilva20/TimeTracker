# TimeFlow — Para quem é esta aplicação?

> **Resumo:** o TimeFlow é um sistema de **gestão de trabalho e controle de horas
> (Work Management / Time Tracking)** com faturamento. Ele conecta _clientes →
> projetos → tarefas → horas trabalhadas → faturas_, e transforma isso em
> relatórios e analytics. É **multi-tenant** (cada usuário/empresa enxerga só os
> próprios dados) e roda sobre o gateway compartilhado da MasIA.

---

## 1. O que o produto faz

| Módulo           | Para que serve                                                        |
| ---------------- | --------------------------------------------------------------------- |
| **Dashboard**    | Visão geral: horas, receita, projetos ativos, produtividade           |
| **Clientes**     | Cadastro de clientes com valor-hora padrão e status                   |
| **Contatos**     | Pessoas ligadas a cada cliente                                        |
| **Projetos**     | Escopo, orçamento, valor-hora, prazo e status por projeto             |
| **Tarefas**      | Quebra do projeto em tarefas com prioridade, responsável e estimativa |
| **Timer**        | Cronômetro para registrar horas em tempo real                         |
| **Time Entries** | Lançamentos de horas (manuais ou do timer), faturáveis ou não         |
| **Calendário**   | Distribuição das horas ao longo dos dias                              |
| **Invoices**     | Faturas geradas a partir das horas faturáveis                         |
| **Relatórios**   | Horas e receita agrupadas por cliente/projeto/membro                  |
| **Analytics**    | Tendências, eficiência e indicadores                                  |
| **Equipe**       | Membros, cargos, valor-hora, meta semanal e carga de trabalho         |

Valores são exibidos em **Real (R$ / BRL)**.

---

## 2. Público-alvo (quem compra e usa)

### Perfil primário — **prestadores de serviço que faturam por hora**

Times pequenos e médios (1 a ~50 pessoas) que precisam responder três perguntas
o tempo todo: _“quanto tempo gastamos?”, “em quê?” e “quanto disso vira
fatura?”_.

- **Agências** (design, marketing, publicidade, branding)
- **Estúdios de software / dev shops / consultorias de TI**
- **Freelancers e profissionais autônomos** que cobram por hora
- **Consultorias** (negócios, jurídica, RH, engenharia)
- **Escritórios de arquitetura e design**

### Perfil secundário — **operações internas que precisam de apuração de horas**

- **PMOs e áreas de projetos** dentro de empresas maiores
- **Times de suporte / serviços profissionais** que faturam clientes
- **Departamentos que rateiam custo de horas** entre centros de custo

### Papéis dentro da ferramenta

- **Admin** — dono da conta; enxerga tudo, configura e fatura
- **Manager** — gerencia projetos, equipe e relatórios
- **Rep (colaborador)** — registra horas e toca suas tarefas

---

## 3. Nichos que poderiam adotar (oportunidades)

Além dos óbvios acima, o modelo _cliente → projeto → hora → fatura_ encaixa em:

1. **Advocacia / contabilidade** — billable hours é o coração do negócio.
2. **Tradução, redação e produção de conteúdo** — cobrança por hora/projeto.
3. **Produtoras de vídeo, foto e áudio** — projetos com equipe e orçamento.
4. **Manutenção e assistência técnica** (TI, elétrica, predial) — ordens de serviço por hora.
5. **Coaches, terapeutas e mentores** — sessões faturáveis por cliente.
6. **Arquitetura, engenharia e projetos** — horas por etapa/projeto.
7. **Educação e treinamento sob demanda** — horas de instrutor por cliente.
8. **Agências de eventos** — projetos temporários com equipe alocada.
9. **Startups em fase de serviços** — antes de produtizar, cobram por hora.
10. **Terceirização de squads / body shop** — alocação e faturamento por pessoa.

### Onde NÃO é o encaixe ideal

- Varejo/e-commerce (não é venda de produto).
- Assinaturas SaaS puras (não é cobrança recorrente por hora).
- Chão de fábrica com ponto eletrônico industrial (é foco em RH/CLT, não em faturamento por projeto).

---

## 4. Proposta de valor em uma frase

> _“Do timer à fatura em um só lugar: registre horas, saiba a rentabilidade de
> cada projeto e cliente, e cobre com precisão — em Real.”_

---

## 5. Como diferenciar / expandir (ideias)

- Integração com pagamento (Stripe/Pix) para receber as faturas.
- Exportação fiscal (NFS-e) para o mercado brasileiro.
- Metas e alertas de estouro de orçamento por projeto.
- App mobile / PWA para bater ponto no timer.
- Aprovação de horas (workflow manager → rep).
