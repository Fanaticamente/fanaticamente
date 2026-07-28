import { useMemo, useState } from "react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import NewsCard, { NewsDrawer } from "@/components/futebol/NewsCard";
import ClubFilterDropdown from "@/components/futebol/ClubFilterDropdown";
import BrasileiraoTable from "@/components/futebol/BrasileiraoTable";
import { useFootballNews } from "@/hooks/useFootballNews";
import { useModuleConfig } from "@/hooks/useModuleConfig";
import { brazilianClubs } from "@/data/brazilianClubs";
import { fixTitleCapitalization } from "@/lib/fixTitleCapitalization";
import { Loader2, Newspaper, Play, Headphones, Lightbulb, Bookmark, Clock, Trophy } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

type TabKey = "todos" | "noticias" | "tabela" | "videos" | "podcasts" | "dicas";

const DEFAULT_TABS: { key: TabKey; label: string; visible?: boolean }[] = [
  { key: "todos", label: "Todos" },
  { key: "noticias", label: "Notícias" },
  { key: "tabela", label: "Tabela" },
  { key: "videos", label: "Vídeos" },
  { key: "podcasts", label: "Podcasts" },
  { key: "dicas", label: "Dicas" },
];

interface ContentItem {
  title?: string;
  description?: string;
  url?: string;
  audio_url?: string;
  image?: string;
  duration?: string;
  published?: boolean;
}

const Futebol = () => {
  const [tab, setTab] = useState<TabKey>("todos");
  const [selectedClub, setSelectedClub] = useState<string | null>(null);
  const { data: news, isLoading } = useFootballNews(selectedClub);

  const { data: tabsModule } = useModuleConfig("football_tabs");
  const { data: newsModule } = useModuleConfig("football_news_section");
  const { data: tableModule } = useModuleConfig("football_table");
  const { data: videosModule } = useModuleConfig("football_videos");
  const { data: podcastsModule } = useModuleConfig("football_podcasts");
  const { data: dicasModule } = useModuleConfig("football_dicas");

  const sectionVisible: Record<string, boolean> = {
    noticias: newsModule?.is_visible !== false,
    tabela: tableModule?.is_visible !== false,
    videos: videosModule?.is_visible !== false,
    podcasts: podcastsModule?.is_visible !== false,
    dicas: dicasModule?.is_visible !== false,
  };

  const TABS = useMemo(() => {
    const cfgTabs = (tabsModule?.config as any)?.tabs as
      | { key: TabKey; label: string; visible?: boolean }[]
      | undefined;
    const base = cfgTabs?.length ? cfgTabs : DEFAULT_TABS;
    return base.filter(
      (t) => t.visible !== false && (sectionVisible[t.key] ?? true)
    );
  }, [tabsModule, newsModule, tableModule, videosModule, podcastsModule, dicasModule]);

  const newsCfg = (newsModule?.config as any) || {};

  const listFor = (key: TabKey): { items: ContentItem[]; emptyText: string } => {
    const mod =
      key === "videos" ? videosModule : key === "podcasts" ? podcastsModule : dicasModule;
    const cfg = (mod?.config as any) || {};
    return {
      items: ((cfg.items || []) as ContentItem[]).filter((i) => i.published !== false),
      emptyText: cfg.empty_text || "Novos conteúdos aparecerão aqui em breve.",
    };
  };

  const selectedClubData = selectedClub
    ? brazilianClubs.find((c) => c.id === selectedClub)
    : null;

  const featured = useMemo(
    () => news?.find((n) => (n as any).is_featured) ?? news?.[0],
    [news]
  );
  const rest = useMemo(
    () => (news ?? []).filter((n) => n.id !== featured?.id),
    [news, featured]
  );

  const showNewsSections = tab === "todos" || tab === "noticias";
  const showTable = tab === "tabela";
  const isListTab = tab === "videos" || tab === "podcasts" || tab === "dicas";
  const listData = isListTab ? listFor(tab) : null;

  return (
    <div className="min-h-screen bg-white">
      <Header title="Conteúdo" />

      <main className="pt-[calc(56px+1cm)] pb-32">
        {/* Tabs */}
        <div className="px-4 mb-5">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className="px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors"
                  style={
                    active
                      ? { backgroundColor: "var(--club-600)", color: "#fff" }
                      : { backgroundColor: "#f3f4f6", color: "#374151" }
                  }
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Club filter (only for news tabs) */}
        {showNewsSections && (
          <div className="px-4 mb-4 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {selectedClubData
                ? `Notícias do ${selectedClubData.name}`
                : newsCfg.subtitle || "Últimas do futebol brasileiro e sul-americano"}
            </p>
            {newsCfg.show_club_filter !== false && (
              <ClubFilterDropdown
                selectedClub={selectedClub}
                onSelectClub={setSelectedClub}
                accentColor="var(--club-600)"
              />
            )}
          </div>
        )}

        {/* Brasileirão table */}
        {showTable && <BrasileiraoTable />}

        {/* Loading */}
        {showNewsSections && isLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--club-600)" }} />
            <p className="text-gray-500 text-sm">Carregando conteúdo...</p>
          </div>
        )}

        {/* Featured */}
        {showNewsSections && !isLoading && featured && (
          <section className="px-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-bold text-gray-900">
                {tab === "noticias"
                  ? "Notícias em destaque"
                  : newsCfg.featured_title || "Em destaque"}
              </h2>
              <button
                onClick={() => setTab("noticias")}
                className="text-xs font-semibold"
                style={{ color: "var(--club-600)" }}
              >
                Ver todos
              </button>
            </div>
            <FeaturedHero item={featured} />
          </section>
        )}

        {/* Recent list */}
        {showNewsSections && !isLoading && rest.length > 0 && (
          <section className="px-4">
            <h2 className="text-[15px] font-bold text-gray-900 mb-3">
              {newsCfg.recent_title || "Mais recentes"}
            </h2>
            <div className="space-y-3">
              {rest.slice(0, Number(newsCfg.max_items) || 20).map((item) => (
                <NewsCard key={item.id} news={item} accentColor="var(--club-600)" />
              ))}
            </div>
          </section>
        )}

        {/* Vídeos / Podcasts / Dicas */}
        {isListTab && listData && listData.items.length > 0 && (
          <section className="px-4 space-y-3">
            {listData.items.map((item, i) => (
              <ContentItemCard key={i} item={item} type={tab} />
            ))}
          </section>
        )}

        {isListTab && listData && listData.items.length === 0 && (
          <div className="px-6 py-16 text-center">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: "color-mix(in srgb, var(--club-600) 12%, transparent)" }}
            >
              {tab === "videos" && <Play className="w-7 h-7" style={{ color: "var(--club-600)" }} />}
              {tab === "podcasts" && <Headphones className="w-7 h-7" style={{ color: "var(--club-600)" }} />}
              {tab === "dicas" && <Lightbulb className="w-7 h-7" style={{ color: "var(--club-600)" }} />}
            </div>
            <p className="text-base font-semibold text-gray-800 mb-1">Em breve</p>
            <p className="text-sm text-gray-500">{listData.emptyText}</p>
          </div>
        )}

        {showNewsSections && !isLoading && (!news || news.length === 0) && (
          <div className="px-6 py-16 text-center">
            <Newspaper className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 text-sm">Nenhuma notícia disponível no momento.</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

const ContentItemCard = ({ item, type }: { item: ContentItem; type: TabKey }) => {
  const isPodcast = type === "podcasts";
  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
      {item.image && (
        <img
          src={item.image}
          alt={item.title || ""}
          loading="lazy"
          className={`w-full object-cover ${isPodcast ? "h-40" : "h-44"}`}
        />
      )}
      <div className="p-4">
        {item.title && (
          <h3 className="text-[15px] font-bold text-gray-900 leading-tight mb-1">{item.title}</h3>
        )}
        {item.duration && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            <Clock className="w-3 h-3" /> {item.duration}
          </div>
        )}
        {item.description && (
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{item.description}</p>
        )}

        {isPodcast && item.audio_url && (
          <audio controls preload="none" src={item.audio_url} className="w-full mt-3" />
        )}

        {!isPodcast && item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-3 text-xs font-semibold"
            style={{ color: "var(--club-600)" }}
          >
            {type === "videos" ? "Assistir" : "Saiba mais"}
          </a>
        )}
      </div>
    </div>
  );
};

const FeaturedHero = ({ item }: { item: NonNullable<ReturnType<typeof useFootballNews>["data"]>[number] }) => {
  const title = fixTitleCapitalization(item.rewritten_title);
  const [open, setOpen] = useState(false);
  const timeAgo = formatDistanceToNow(new Date(item.published_at), {
    addSuffix: true,
    locale: ptBR,
  }).replace(/^cerca de /, "");

  return (
    <>
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label={title}
      className="relative block w-full text-left rounded-2xl overflow-hidden bg-gray-900 h-[220px]"
    >
      {item.image_url && (
        <img
          src={item.image_url}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
      <span className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center">
        <Bookmark className="w-4 h-4 text-white" />
      </span>
      <div className="absolute left-4 right-4 bottom-3">
        <h3 className="text-white text-lg font-bold leading-tight line-clamp-2 mb-1">{title}</h3>
        <div className="flex items-center gap-2 text-white/80 text-xs">
          <Clock className="w-3 h-3" />
          <span>{timeAgo}</span>
        </div>
      </div>
    </button>
    <NewsDrawer news={item} isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default Futebol;