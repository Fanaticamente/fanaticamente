import { Link } from "react-router-dom";
import { ArrowLeft, Play, CheckCircle2, Sparkles, GraduationCap, Trophy, BookOpen, Clock, ChevronRight } from "lucide-react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import UserDesktopLayout from "@/components/layout/UserDesktopLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRadio } from "@/contexts/RadioContext";
import { useMyCoursesData } from "@/hooks/useMyCoursesData";
import { useContinueWatching } from "@/hooks/useContinueWatching";
import { useCourses } from "@/hooks/useCourses";
import { useUserCourseAccess } from "@/hooks/useUserCourseAccess";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import MeusCursosInfoCard from "@/components/courses/MeusCursosInfoCard";

const ConsciousnessBadge = ({
  rankLabel,
  nextRankLabel,
  percent,
  points,
  pointsToNext,
}: {
  rankLabel: string;
  nextRankLabel: string | null;
  percent: number;
  points: number;
  pointsToNext: number;
}) => (
  <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/80 via-neutral-900 to-neutral-900 p-5">
    <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
    <div className="relative flex items-start gap-4">
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-900/50">
        <Sparkles className="w-7 h-7 text-white" strokeWidth={2.2} />
      </div>
      <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-widest text-white font-semibold drop-shadow">Nível de Consciência</p>
        <h2 className="text-white text-xl font-bold mt-0.5 leading-tight">{rankLabel}</h2>
        <div className="mt-3">
          <Progress value={percent} className="h-2 bg-neutral-800 [&>div]:bg-gradient-to-r [&>div]:from-emerald-400 [&>div]:to-emerald-500" />
          <div className="flex justify-between mt-1.5 text-[11px] text-neutral-400">
            <span>{points} pts</span>
            <span>
              {nextRankLabel ? `${pointsToNext} pts para ${nextRankLabel}` : "Nível máximo atingido"}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const StatCard = ({ icon: Icon, label, value, accent }: { icon: typeof BookOpen; label: string; value: number | string; accent?: string }) => (
  <div className="flex flex-col items-center justify-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-xl py-3 px-2">
    <Icon className={`w-5 h-5 ${accent ?? "text-emerald-500"}`} strokeWidth={2.2} />
    <span className="text-white text-lg font-bold leading-none">{value}</span>
    <span className="text-neutral-400 text-[10px] uppercase tracking-wide text-center leading-tight">{label}</span>
  </div>
);

const CourseProgressRow = ({
  courseId,
  title,
  thumbnailUrl,
  progressPercent,
  completedLessons,
  totalLessons,
  status,
}: {
  courseId: string;
  title: string;
  thumbnailUrl: string | null;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  status: "not_started" | "in_progress" | "completed";
}) => (
  <Link
    to={`/curso/${courseId}`}
    className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 active:scale-[0.99] transition-transform"
  >
    <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-neutral-800 shrink-0">
      {thumbnailUrl ? (
        <img src={thumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Play className="w-5 h-5 text-neutral-600" />
        </div>
      )}
      {status === "completed" && (
        <div className="absolute inset-0 bg-emerald-500/30 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-white drop-shadow" />
        </div>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="text-white text-sm font-semibold line-clamp-2 leading-tight">{title}</h3>
      <p className="text-neutral-400 text-[11px] mt-1">
        {totalLessons > 0
          ? `${completedLessons} de ${totalLessons} aulas`
          : "Sem aulas disponíveis"}
      </p>
      <div className="mt-1.5">
        <Progress
          value={progressPercent}
          className="h-1 bg-neutral-800 [&>div]:bg-emerald-500"
        />
      </div>
    </div>
    <ChevronRight className="w-4 h-4 text-neutral-500 shrink-0" />
  </Link>
);

const DiscoverCard = ({
  courseId,
  title,
  thumbnailUrl,
  isPremium,
  comingSoon,
}: {
  courseId: string;
  title: string;
  thumbnailUrl: string | null;
  isPremium: boolean;
  comingSoon: boolean;
}) => {
  const content = (
    <>
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-neutral-800">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Play className="w-6 h-6 text-neutral-600" />
          </div>
        )}
        {isPremium && (
          <span className="absolute top-1.5 right-1.5 bg-white text-gray-800 text-[9px] font-bold py-0.5 px-1.5 rounded-full">PRO</span>
        )}
        {comingSoon && (
          <span className="absolute bottom-1.5 right-1.5 bg-amber-500 text-white text-[9px] font-bold py-0.5 px-1.5 rounded-full">EM BREVE</span>
        )}
      </div>
      <p className="text-white text-xs font-medium mt-1.5 line-clamp-2">{title}</p>
    </>
  );
  if (comingSoon) {
    return <div className="flex-shrink-0 w-28 opacity-70">{content}</div>;
  }
  return (
    <Link to={`/curso/${courseId}`} className="flex-shrink-0 w-28 group">
      {content}
    </Link>
  );
};

const MeusCursos = () => {
  const isMobile = useIsMobile();
  const { playingStation } = useRadio();
  const { data, isLoading } = useMyCoursesData();
  const { items: continueWatching } = useContinueWatching();
  const { data: allCourses } = useCourses();
  const { data: accessData } = useUserCourseAccess();

  const enrolledIds = new Set((data?.courses ?? []).map((c) => c.courseId));
  const discoverCourses = (allCourses ?? []).filter(
    (c) => !enrolledIds.has(c.id) && !c.coming_soon
  );
  const comingSoonCourses = (allCourses ?? []).filter((c) => c.coming_soon);

  const inProgress = (data?.courses ?? []).filter((c) => c.status === "in_progress");
  const completed = (data?.courses ?? []).filter((c) => c.status === "completed");
  const notStarted = (data?.courses ?? []).filter((c) => c.status === "not_started");

  const Content = () => (
    <div className="space-y-6">
      {/* Consciousness header */}
      {isLoading || !data ? (
        <Skeleton className="h-28 rounded-2xl" />
      ) : (
        <ConsciousnessBadge
          rankLabel={data.rankLabel}
          nextRankLabel={data.nextRankLabel}
          percent={data.consciousnessPercent}
          points={data.consciousnessPoints}
          pointsToNext={data.pointsToNextRank}
        />
      )}

      {/* Stats grid */}
      {data && (
        <div className="grid grid-cols-4 gap-2">
          <StatCard icon={BookOpen} label="Adquiridos" value={data.totalAccessibleCourses} />
          <StatCard icon={Play} label="Em curso" value={data.totalInProgressCourses} accent="text-sky-400" />
          <StatCard icon={Trophy} label="Concluídos" value={data.totalCompletedCourses} accent="text-amber-400" />
          <StatCard icon={GraduationCap} label="Aulas vistas" value={data.totalCompletedLessons} accent="text-violet-400" />
        </div>
      )}

      {/* Continue watching */}
      {continueWatching.length > 0 && (
        <section>
          <h2 className="text-white text-sm font-bold uppercase tracking-wider mb-3">Continuar assistindo</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {continueWatching.map((item) => (
              <Link
                key={item.lessonId}
                to={`/curso/${item.courseId}?lesson=${item.lessonId}`}
                className="flex-shrink-0 w-36 group"
              >
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-neutral-800">
                  {item.thumbnailUrl ? (
                    <img src={item.thumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-neutral-700 to-neutral-900" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-black/50 border border-white/70 backdrop-blur-sm flex items-center justify-center">
                      <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                    <div className="h-full bg-emerald-500" style={{ width: `${item.progressPercent}%` }} />
                  </div>
                </div>
                <p className="text-white text-xs font-medium mt-1.5 line-clamp-1">{item.courseTitle}</p>
                <p className="text-neutral-400 text-[11px] line-clamp-1">{item.lessonTitle}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Em andamento */}
      {inProgress.length > 0 && (
        <section>
          <h2 className="text-white text-sm font-bold uppercase tracking-wider mb-3">Em andamento</h2>
          <div className="space-y-2">
            {inProgress.map((c) => (
              <CourseProgressRow key={c.courseId} {...c} />
            ))}
          </div>
        </section>
      )}

      {/* Concluídos */}
      {completed.length > 0 && (
        <section>
          <h2 className="text-white text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" /> Concluídos
          </h2>
          <div className="space-y-2">
            {completed.map((c) => (
              <CourseProgressRow key={c.courseId} {...c} />
            ))}
          </div>
        </section>
      )}

      {/* Adquiridos não iniciados */}
      {notStarted.length > 0 && (
        <section>
          <h2 className="text-white text-sm font-bold uppercase tracking-wider mb-3">Comece agora</h2>
          <div className="space-y-2">
            {notStarted.map((c) => (
              <CourseProgressRow key={c.courseId} {...c} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!isLoading && data && data.courses.length === 0 && (
        <div className="text-center py-8 px-4 border border-dashed border-neutral-800 rounded-2xl">
          <GraduationCap className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
          <h3 className="text-white text-base font-semibold mb-1">Você ainda não possui cursos</h3>
          <p className="text-neutral-400 text-sm mb-4">Comece sua trilha de consciência hoje mesmo.</p>
          <Link
            to="/cursos"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl"
          >
            Explorar FanatiClass <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Descobrir */}
      {discoverCourses.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white text-sm font-bold uppercase tracking-wider">Descobrir cursos</h2>
            <Link to="/cursos" className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
              Ver tudo <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {discoverCourses.map((c) => (
              <DiscoverCard
                key={c.id}
                courseId={c.id}
                title={c.title}
                thumbnailUrl={c.thumbnail_url}
                isPremium={c.is_premium}
                comingSoon={c.coming_soon}
              />
            ))}
          </div>
        </section>
      )}

      {/* Em breve */}
      {comingSoonCourses.length > 0 && (
        <section>
          <h2 className="text-white text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" /> Em breve
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {comingSoonCourses.map((c) => (
              <DiscoverCard
                key={c.id}
                courseId={c.id}
                title={c.title}
                thumbnailUrl={c.thumbnail_url}
                isPremium={c.is_premium}
                comingSoon
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <MeusCursosInfoCard />
        <Header title="Meus cursos" />
        <header
          className="fixed left-0 right-0 z-40 bg-background border-b border-neutral-800 pb-3"
          style={{
            top: 0,
            paddingTop: `calc(env(safe-area-inset-top) + ${playingStation ? 60 : 12}px)`,
          }}
        >
          <div className="flex items-center gap-3 px-4">
            <Link to="/" className="w-9 h-9 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">Meus Cursos</h1>
              <p className="text-neutral-400 text-[11px]">Sua trilha de consciência</p>
            </div>
          </div>
        </header>
        <main
          className="px-4"
          style={{
            paddingTop: `calc(env(safe-area-inset-top) + ${playingStation ? 120 : 72}px)`,
            paddingBottom: "8rem",
          }}
        >
          <Content />
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <UserDesktopLayout title="Meus Cursos" subtitle="Sua trilha de consciência">
      <MeusCursosInfoCard />
      <Content />
    </UserDesktopLayout>
  );
};

export default MeusCursos;