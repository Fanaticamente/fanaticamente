import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type LegalSlug =
  | "privacy-policy"
  | "privacy-policy-professional"
  | "terms-of-use";

export interface LegalDocument {
  slug: LegalSlug;
  title: string;
  content_html: string;
  updated_at: string;
  created_at: string;
}

export const useLegalDocument = (slug: LegalSlug) => {
  return useQuery({
    queryKey: ["legal-document", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("legal_documents")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data as LegalDocument | null;
    },
  });
};

export const useUpdateLegalDocument = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ slug, content_html }: { slug: LegalSlug; content_html: string }) => {
      const { data, error } = await supabase
        .from("legal_documents")
        .update({ content_html, updated_at: new Date().toISOString() })
        .eq("slug", slug)
        .select()
        .single();
      if (error) throw error;
      return data as LegalDocument;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["legal-document", vars.slug] });
    },
  });
};