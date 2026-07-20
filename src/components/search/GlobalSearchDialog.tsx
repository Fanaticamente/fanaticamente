import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Search, X, Users, BookOpen, Home, Heart, Radio, Newspaper, MessageCircle, Trophy, Calendar, User, Bell, Settings, Activity, ClipboardList } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Item = {
  key: string;
  title: string;
  subtitle?: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  group: "Páginas" | "Terapeutas" | "FanatiClass";
};

// Only mobile-visible destinations. Never link to desktop/admin/developer routes.
const staticPages: Item[] = [
  { key: "p-home", title: "Início", path: "/", icon: Home, group: "Páginas" },
  { key: "p-bem", title: "Bem-estar", path: "/bem-estar", icon: Heart, group: "Páginas" },
  { key: "p-tera", title: "Terapeutas", path: "/terapeutas", icon: Users, group: "Páginas" },
  { key: "p-cursos", title: "FanatiClass", subtitle: "Cursos e conteúdos", path: "/cursos", icon: BookOpen, group: "Páginas" },
  { key: "p-radio", title: "Alambrado FM", subtitle: "Rádios esportivas", path: "/radio", icon: Radio, group: "Páginas" },
  { key: "p-fut", title: "Conteúdos sobre Futebol & Saúde", path: "/futebol", icon: Newspaper, group: "Páginas" },
  { key: "p-com", title: "Comunidade", subtitle: "Brasileirão e ranking", path: "/comunidade", icon: Trophy, group: "Páginas" },
  { key: "p-diario", title: "Campo das emoções", path: "/diario", icon: Activity, group: "Páginas" },
  { key: "p-temp", title: "Minha temporada", path: "/minha-temporada", icon: Trophy, group: "Páginas" },
  { key: "p-quiz", title: "Resenha Fanática", path: "/quiz", icon: MessageCircle, group: "Páginas" },
  { key: "p-zona", title: "Zona Mista", path: "/zona-mista", icon: Newspaper, group: "Páginas" },
  { key: "p-setor", title: "Setor Saúde", path: "/setor-saude", icon: Heart, group: "Páginas" },
  { key: "p-osmf", title: "OSMF", subtitle: "Observatório", path: "/osmf", icon: ClipboardList, group: "Páginas" },
  { key: "p-ag", title: "Meus agendamentos", path: "/meus-agendamentos", icon: Calendar, group: "Páginas" },
  { key: "p-mc", title: "Meus cursos", path: "/meus-cursos", icon: BookOpen, group: "Páginas" },
  { key: "p-perf", title: "Perfil", path: "/perfil", icon: User, group: "Páginas" },
  { key: "p-not", title: "Notificações", path: "/notificacoes", icon: Bell, group: "Páginas" },
  { key: "p-cfg", title: "Configurações", path: "/configuracoes", icon: Settings, group: "Páginas" },
];

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const GlobalSearchDialog = ({ open, onClose }: Props) => {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [pros, setPros] = useState<Item[]>([]);
  const [courses, setCourses] = useState<Item[]>([]);

  useEffect(() => {
    if (!open) return;
    setQ("");
    (async () => {
      const [{ data: p }, { data: c }] = await Promise.all([
        supabase.from("professionals_public").select("id, full_name").limit(200),
        supabase.from("courses").select("id, title, is_published").eq("is_published", true).limit(200),
      ]);
      setPros(
        (p ?? []).map((r: any) => ({
          key: `pro-${r.id}`,
          title: r.full_name ?? "Profissional",
          subtitle: "Terapeuta",
          path: `/terapeuta/${r.id}`,
          icon: Users,
          group: "Terapeutas" as const,
        }))
      );
      setCourses(
        (c ?? []).map((r: any) => ({
          key: `crs-${r.id}`,
          title: r.title ?? "Curso",
          subtitle: "FanatiClass",
          path: `/curso/${r.id}`,
          icon: BookOpen,
          group: "FanatiClass" as const,
        }))
      );
    })();
  }, [open]);

  const results = useMemo(() => {
    const all = [...staticPages, ...pros, ...courses];
    const nq = normalize(q.trim());
    if (!nq) return all;
    return all.filter((i) =>
      normalize(i.title).includes(nq) || (i.subtitle && normalize(i.subtitle).includes(nq))
    );
  }, [q, pros, courses]);

  const grouped = useMemo(() => {
    const g: Record<string, Item[]> = {};
    for (const r of results) (g[r.group] ??= []).push(r);
    return g;
  }, [results]);

  if (!open || typeof document === "undefined") return null;

  const go = (path: string) => {
    onClose();
    navigate(path);
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] bg-white flex flex-col">
      <div className="flex items-center gap-2 px-3 py-2 pt-[calc(env(safe-area-inset-top)+8px)] border-b border-slate-200">
        <button
          aria-label="Fechar"
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center text-slate-700"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex-1 flex items-center gap-2 px-3 h-10 rounded-full bg-slate-100">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar páginas, terapeutas, cursos..."
            className="flex-1 bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {Object.keys(grouped).length === 0 && (
          <div className="p-8 text-center text-sm text-slate-500">Nada encontrado.</div>
        )}
        {(["Páginas", "Terapeutas", "FanatiClass"] as const).map((g) =>
          grouped[g] && grouped[g].length ? (
            <div key={g} className="py-2">
              <div className="px-4 py-2 text-[11px] uppercase tracking-wide text-slate-400 font-medium">
                {g}
              </div>
              {grouped[g].map((it) => {
                const Icon = it.icon;
                return (
                  <button
                    key={it.key}
                    onClick={() => go(it.path)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left"
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "var(--club-50)", color: "var(--club-600)" }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800 truncate">{it.title}</p>
                      {it.subtitle && (
                        <p className="text-xs text-slate-500 truncate">{it.subtitle}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null
        )}
      </div>
    </div>,
    document.body
  );
};

export default GlobalSearchDialog;