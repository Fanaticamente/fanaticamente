import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  LEGAL_PATHS,
  isLegalGateExemptPath,
} from "@/lib/legalAcceptance";

type PendingDoc = {
  slug: string;
  title: string;
  version: number;
  previously_accepted: boolean;
};

export const recordLegalAcceptance = async (slugs: string[], source: "reaccept_prompt") => {
  const { data, error } = await supabase.functions.invoke("record-legal-acceptance", {
    body: { slugs, source },
  });
  if (error) throw error;
  return data;
};

const LegalAcceptanceGate = () => {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const qc = useQueryClient();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const { data: pending } = useQuery({
    queryKey: ["legal-pending", user?.id],
    enabled: !!user,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_pending_legal_documents");
      if (error) throw error;
      return (data ?? []) as PendingDoc[];
    },
  });

  // Signup acceptance is converted server-side (database) after identity confirmation;
  // nothing from browser storage is used as evidence.
  if (!user || !pending || pending.length === 0 || isLegalGateExemptPath(pathname)) return null;

  const allChecked = pending.every((p) => checked[p.slug]);
  const isUpdate = pending.some((p) => p.previously_accepted);

  const submit = async () => {
    if (!allChecked) return;
    setSaving(true);
    try {
      await recordLegalAcceptance(pending.map((p) => p.slug), "reaccept_prompt");
      await qc.invalidateQueries({ queryKey: ["legal-pending"] });
      setChecked({});
      // Protected data was blocked server-side while pending; reload so every screen refetches.
      window.location.reload();
    } catch {
      toast.error("Não foi possível registrar o aceite. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xl">
        <h2 className="font-display text-xl mb-2">
          {isUpdate ? "Atualizamos nossos documentos" : "Aceite dos documentos"}
        </h2>
        <p className="text-sm text-muted-foreground mb-5">
          Para continuar usando a plataforma, leia e aceite as versões vigentes abaixo.
        </p>
        <div className="space-y-4">
          {pending.map((p) => (
            <div key={p.slug} className="flex items-start gap-3">
              <Checkbox
                id={`gate-${p.slug}`}
                checked={!!checked[p.slug]}
                onCheckedChange={(c) => setChecked((prev) => ({ ...prev, [p.slug]: c === true }))}
                className="mt-0.5"
              />
              <label htmlFor={`gate-${p.slug}`} className="text-sm leading-relaxed cursor-pointer">
                Li e aceito {p.slug.startsWith("terms") ? "os " : "a "}
                <Link to={LEGAL_PATHS[p.slug]} target="_blank" className="underline font-medium">
                  {p.title}
                </Link>{" "}
                <span className="text-muted-foreground">(versão {p.version})</span>
              </label>
            </div>
          ))}
        </div>
        <button
          onClick={submit}
          disabled={!allChecked || saving}
          className="mt-6 w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-40"
        >
          {saving ? "Registrando..." : "Aceitar e continuar"}
        </button>
      </div>
    </div>
  );
};

export default LegalAcceptanceGate;
