# Project Architecture

- Professional marketplace visibility and record lifecycle use separate `marketplace_visible` and `deleted_at` fields so administrators can hide or archive profiles without losing internal data.
- Use Manrope for interface text and Sora for headings across all four systems; keep newspaper article copy in Georgia, and keep the shared small-text scale readable across responsive cards.
- Route transitions always reset document scrolling to the top because the application uses the browser window as its shared scroll container.
