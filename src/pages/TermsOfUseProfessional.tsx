import LegalDocumentView from "@/components/legal/LegalDocumentView";

const TermsOfUseProfessional = () => (
  <LegalDocumentView
    slug="terms-of-use-professional"
    title="Termos de Uso — Profissional"
    fallback={
      <div className="prose prose-sm max-w-none text-black">
        <p>
          Os Termos de Uso para profissionais parceiros ainda não foram
          publicados. O administrador da plataforma poderá cadastrar o conteúdo
          pelo painel Jurídico.
        </p>
      </div>
    }
  />
);

export default TermsOfUseProfessional;
