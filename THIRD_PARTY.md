# Third-party code

Per `Importantdoc.md` §A2: código copiado de projetos OSS permissivos deve ser
creditado aqui com licença + link. Isto cobre apenas **código físico copiado**
para dentro deste repositório — dependências normais do `npm` já declaram sua
própria licença em `package.json`/`node_modules` e não precisam de entrada
duplicada aqui.

## `src/components/ui/**` — shadcn/ui

Os 44 componentes em `src/components/ui/` foram gerados pelo CLI do
[shadcn/ui](https://ui.shadcn.com) (style `new-york`, ver `components.json`) e
copiados para o repositório — não são uma dependência de `npm`, o próprio
modelo do shadcn/ui é distribuir código-fonte para o consumidor copiar e
manter. Correspondem ao design system "Atelier" descrito no `Importantdoc.md`
§B9 para o scaffold `wiki`.

- **shadcn/ui** — MIT License. <https://github.com/shadcn-ui/ui>
- **Radix UI** (primitivas headless por trás de boa parte desses componentes,
  já declaradas como dependências normais em `package.json`) — MIT License.
  <https://github.com/radix-ui/primitives>
- **lucide-react** (ícones) — ISC License. <https://github.com/lucide-icons/lucide>

Nenhum desses componentes foi modificado além de reordenação automática de
imports (Prettier/ESLint) — permanecem no estado gerado pelo CLI.

## Sem outras origens identificadas

Nenhum outro trecho de UI/domínio deste template foi identificado como
copiado de um dos projetos OSS catalogados na curadoria do hub (referenciada
em `Importantdoc.md` §A4, mantida em repositório separado) — o domínio
(gestão de tempo/projetos) e as telas de negócio são implementação original
para este template.
