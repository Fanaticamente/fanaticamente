import LegalDocumentView from "@/components/legal/LegalDocumentView";

const TermsOfUse = () => (
  <LegalDocumentView
    slug="terms-of-use"
    title="Termos de Uso"
    fallback={
      <div className="prose prose-sm max-w-none text-black">
        <p>
          Os Termos de Uso ainda não foram publicados. O administrador da
          plataforma poderá cadastrar o conteúdo pelo painel Jurídico.
        </p>
      </div>
    }
  />
);

export default TermsOfUse;