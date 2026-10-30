import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type LegalSlug =
  | "privacy-policy"
  | "privacy-policy-professional"
  | "terms-of-use"
  | "terms-of-use-professional";

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

export interface LegalDocumentVersion {
  id: string;
  slug: string;
  version: number;
  title: string;
  content_html: string;
  content_sha256: string;
  requires_reacceptance: boolean;
  change_summary: string | null;
  published_at: string;
}

export const useLegalVersions = (slug: LegalSlug) =>
  useQuery({
    queryKey: ["legal-versions", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("legal_document_versions")
        .select("*")
        .eq("slug", slug)
        .order("version", { ascending: false });
      if (error) throw error;
      return (data ?? []) as LegalDocumentVersion[];
    },
  });

export const usePublishLegalVersion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { slug: LegalSlug; content_html: string; requires_reacceptance: boolean; change_summary: string }) => {
      const { data, error } = await supabase.rpc("publish_legal_document_version", {
        _slug: v.slug,
        _content_html: v.content_html,
        _requires_reacceptance: v.requires_reacceptance,
        _change_summary: v.change_summary || null,
      } as any);
      if (error) throw error;
      return data as unknown as LegalDocumentVersion;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["legal-document", vars.slug] });
      qc.invalidateQueries({ queryKey: ["legal-versions", vars.slug] });
      qc.invalidateQueries({ queryKey: ["legal-pending"] });
    },
  });
};

/**
 * Public display source of truth: the immutable version table.
 * With `versionId`, returns that exact version (used by the acceptance window link);
 * otherwise the latest published version of the slug.
 */
export const useLegalPublicVersion = (slug: LegalSlug, versionId?: string | null) =>
  useQuery({
    queryKey: ["legal-public-version", slug, versionId ?? "latest"],
    queryFn: async () => {
      let q = supabase.from("legal_document_versions").select("*").eq("slug", slug);
      q = versionId ? q.eq("id", versionId) : q.order("version", { ascending: false }).limit(1);
      const { data, error } = await q.maybeSingle();
      if (error) throw error;
      return data as LegalDocumentVersion | null;
    },
  });

/** SHA-256 hex of the UTF-8 bytes of a string, exactly as the database computes it. */
export const sha256Utf8Hex = async (text: string) => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
};
