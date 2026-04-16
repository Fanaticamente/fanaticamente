---
name: PWA Silent Update Policy
description: PWA auto-updates only after 1h of inactivity, never during typing, video playback, or active onboarding draft.
type: feature
---
The PWA service worker (`src/main.tsx`) applies updates silently via `updateSW(true)`, but the reload is blocked while ANY of these conditions hold:

- Manager stability flag (`fanatica_disable_sw`) is set
- Current path starts with `/curso` (video may be playing)
- Any `<video>` element is currently playing
- The active element is an INPUT, TEXTAREA, SELECT, or contentEditable (user is typing)
- A fresh `professional_onboarding_wizard` draft exists in localStorage (<7 days old)
- Less than 1 hour has elapsed since the last user activity (pointerdown, keydown, touchstart, focus, visibilitychange)

When blocked, the update is queued and re-checked every 5 minutes. This prevents the app from reloading and wiping form data when the user briefly leaves and returns to the app.
