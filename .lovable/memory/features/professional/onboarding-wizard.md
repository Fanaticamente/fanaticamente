---
name: Professional Onboarding Wizard
description: Step-by-step wizard for new professionals to complete their profile before accessing the dashboard.
type: feature
---
The onboarding wizard (`OnboardingWizard.tsx`) guides new professionals through 8 steps:

1. **Foto** – Upload professional photo (mandatory)
2. **Formação** – Select degree base + optional title with document upload
3. **Documentos** – CRP card photos (front + back) AND CRP number input (format `XX/XXXXX`). All three required to advance.
4. **Bio** – Write professional bio (min 50 chars)
5. **Especialidades** – Select specialties (1-6, from predefined list)
6. **Valor** – Session duration, price, show price toggle, Sócio Consciente
7. **Recebimento** – Configure PIX random key for receiving payments
8. **Plano** – Subscribe to a plan via MercadoPago (last step, has own CTA)

CRP is NO LONGER collected at the signup screen — it is collected here at step 3 and saved with all profile data on completion. The `professionals.crp` column is nullable to allow professional record creation at signup without CRP.

Profile data (including CRP) is saved to DB only when the subscription step completes successfully.
Subscription step uses existing `SubscriptionPlans` component with MercadoPago checkout.
Draft progress persisted in localStorage key `professional_onboarding_wizard` (7-day expiry, so users can leave and resume the app without losing data).
Wizard renders full-screen, hiding `ProfessionalBottomNav`.
