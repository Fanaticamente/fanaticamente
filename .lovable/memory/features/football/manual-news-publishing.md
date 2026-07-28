---
name: Manual Football News Publishing
description: Automatic news scraping disabled; football news are published manually via Marketing > Futebol > Publicar Notícias
type: feature
---
- The `scrape-football-news` cron job was unscheduled and the app no longer auto-triggers scraping (`useFootballNews`).
- News are created/edited manually in `FootballNewsManager` (Marketing & Conteúdo → Futebol / Conteúdo → "Publicar Notícias").
- `football_news` gained `subtitle` and `is_featured` (only one featured at a time); the Futebol page hero uses `is_featured`, falling back to the most recent.
- Editable fields: title, subtitle, content, cover image + caption/credits, category, club, publish date/time, featured flag.
