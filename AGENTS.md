<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Application rules
- Use generated Cloud clients; client data is shared by all signed-in office users through RLS, and browser calls never use privileged keys.
- Keep spreadsheet normalization in a browser-safe library with concrete tests; transactional database RPCs replace only supplied sheets and clone client dependencies atomically.
- Share session, selected client and navigation through a root provider; protected named routes use the Cloud client-only authenticated layout.
- Keep document and salary screens title-only until their briefs; schedule math stays in pure functions under src/lib/escala covered by Vitest, and PDFs share the src/lib/pdf.ts header/footer.

- Data access requires an office/admin row in public.user_roles (is_office_member()); signup alone grants nothing, preventing strangers from reading client data.
- Documents are one block list per document (src/lib/documentos/blocos.ts) rendered by preview, Word and PDF, so all three always match; document PDFs use their own A4 cover/header layout.
- Regimento and Código de Ética share one generator (src/components/regimento/Gerador.tsx) driven by a Modelo config in src/lib/regimento/montar.ts (seeds in src/data/), with user-added articles/chapters kept in per-client localStorage state; green/gold tokens are scoped to .rg.
- Primary menus stay in the sticky header; every secondary navigation is a vertical side rail built from src/components/governanca/SideRail.tsx beside the page content, so sub-screens read as one group and collapse to a horizontal strip on narrow screens.
- Recruitment: CV PDFs live in the private 'curriculos' bucket; AI analysis runs in an authenticated server function (src/lib/recrutamento/analisar.functions.ts) and weighted scoring stays pure in src/lib/recrutamento/avaliacao.ts with tests.
- Schedule days are built by src/lib/escala/montarDia.ts as one lane per posto (pairs cover each other's lunch), so presence never exceeds postos.
