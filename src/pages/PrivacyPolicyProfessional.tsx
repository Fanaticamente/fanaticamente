import LegalDocumentView from "@/components/legal/LegalDocumentView";

const PrivacyPolicyProfessional = () => (
  <LegalDocumentView
    slug="privacy-policy-professional"
    title="Política de Privacidade — Profissional"
    fallback={
      <div className="prose prose-sm max-w-none text-black">
        <p>
          A Política de Privacidade do Profissional ainda não foi publicada. O
          administrador da plataforma poderá cadastrar o conteúdo pelo painel
          Jurídico.
        </p>
      </div>
    }
    fallbackDate="17 de março de 2026"
  />
);

export default PrivacyPolicyProfessional;