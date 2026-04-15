---
name: Professional Onboarding Wizard
description: Step-by-step wizard for new professionals to complete their profile before accessing the dashboard.
type: feature
---
The onboarding wizard (`OnboardingWizard.tsx`) guides new professionals through 8 steps:

1. **Foto** – Upload professional photo (mandatory)
2. **Formação** – Select degree base + optional title with document upload
3. **Documentos** – CRP document upload (front/back, recommended not blocking)
4. **Bio** – Write professional bio (min 50 chars)
5. **Especialidades** – Select specialties (1-6, from predefined list)
6. **Valor** – Session duration, price, show price toggle, Sócio Consciente
7. **Recebimento** – Configure PIX random key for receiving payments
8. **Plano** – Subscribe to a plan via MercadoPago (last step, has own CTA)

Profile data is saved to DB when leaving step 6 (before payment steps).
Subscription step uses existing `SubscriptionPlans` component with MercadoPago checkout.
Draft progress persisted in localStorage key `professional_onboarding_wizard`.
Wizard renders full-screen, hiding `ProfessionalBottomNav`.
Completion requires successful subscription payment.
