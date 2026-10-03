# Project Architecture

- Professional marketplace visibility and record lifecycle use separate `marketplace_visible` and `deleted_at` fields so administrators can hide or archive profiles without losing internal data.
- Use Manrope for interface text and Sora for headings across all four systems; keep newspaper article copy in Georgia, and keep the shared small-text scale readable across responsive cards.
- Route transitions always reset document scrolling to the top because the application uses the browser window as its shared scroll container.
- Mobile page offsets must include `env(safe-area-inset-top)` only once: `body` already applies it in index.css, so page containers add plain fixed clearances below fixed headers; a second `env()` in flow content doubles the top spacing on iPhones.
- Static fan-facing interface copy is cataloged by the Vite fan-copy transform and edited through app_content overrides; dynamic account, article, score, and user content remain outside the text editor to preserve ownership and safety.
- Unsaved fan text previews use a tab-scoped sessionStorage draft read only with an explicit preview URL flag, so public content never changes before saving.
