import { Link } from "react-router-dom";
import { Play, CheckCircle2, Sparkles, GraduationCap, Trophy, BookOpen, Clock, ChevronRight } from "lucide-react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import UserDesktopLayout from "@/components/layout/UserDesktopLayout";
import { useIsMobile } from "@/hooks/use-mobile";
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
  <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm p-5">
    <div className="absolute -right-8 -top-8 w-32 h-32 bg-[var(--club-50)] rounded-full blur-2xl" />
    <div className="relative flex items-start gap-4">
      <div className="w-14 h-14 rounded-full bg-[var(--club-600)] flex items-center justify-center shrink-0">
        <Sparkles className="w-7 h-7 text-white" strokeWidth={2.2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] uppercase tracking-widest text-[var(--club-600)] font-semibold">Nível de Consciência</p>
        <h2 className="text-slate-900 text-xl font-bold mt-0.5 leading-tight normal-case">{rankLabel}</h2>
        <div className="mt-3">
          <Progress value={percent} className="h-2 bg-slate-100 [&>div]:bg-[var(--club-600)]" />
          <div className="flex justify-between mt-1.5 text-[11px] text-slate-500">
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

const StatCard = ({ icon: Icon, label, value }: { icon: typeof BookOpen; label: string; value: number | string; accent?: string }) => (
  <div className="flex flex-col items-center justify-center gap-1.5 bg-white border border-slate-200/70 shadow-sm rounded-2xl py-3 px-2">
    <Icon className="w-5 h-5 text-[var(--club-600)]" strokeWidth={2.2} />
    <span className="text-slate-900 text-lg font-extrabold leading-none">{value}</span>
    <span className="text-slate-500 text-[10px] uppercase tracking-wide text-center leading-tight">{label}</span>
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
    className="flex items-center gap-3 bg-white border border-slate-200/70 shadow-sm rounded-2xl p-2.5 active:scale-[0.99] transition-transform"
  >
    <div className="relative w-16 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0">
      {thumbnailUrl ? (
        <img src={thumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Play className="w-5 h-5 text-slate-400" />
        </div>
      )}
      {status === "completed" && (
        <div className="absolute inset-0 bg-[var(--club-600)]/30 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-white drop-shadow" />
        </div>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="text-slate-900 text-sm font-semibold line-clamp-2 leading-tight normal-case">{title}</h3>
      <p className="text-slate-500 text-[11px] mt-1">
        {totalLessons > 0
          ? `${completedLessons} de ${totalLessons} aulas`
          : "Sem aulas disponíveis"}
      </p>
      <div className="mt-1.5">
        <Progress
          value={progressPercent}
          className="h-1 bg-slate-100 [&>div]:bg-[var(--club-600)]"
        />
      </div>
    </div>
    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
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
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-200/70">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Play className="w-6 h-6 text-slate-400" />
          </div>
        )}
        {isPremium && (
          <span className="absolute top-1.5 right-1.5 bg-[var(--club-600)] text-white text-[9px] font-bold py-0.5 px-1.5 rounded-full">PRO</span>
        )}
        {comingSoon && (
          <span className="absolute bottom-1.5 right-1.5 bg-slate-900/85 text-white text-[9px] font-bold py-0.5 px-1.5 rounded-full">EM BREVE</span>
        )}
      </div>
      <p className="text-slate-900 text-xs font-semibold mt-1.5 line-clamp-2 normal-case">{title}</p>
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
          <StatCard icon={Play} label="Em curso" value={data.totalInProgressCourses} />
          <StatCard icon={Trophy} label="Concluídos" value={data.totalCompletedCourses} />
          <StatCard icon={GraduationCap} label="Aulas vistas" value={data.totalCompletedLessons} />
        </div>
      )}

      {/* Continue watching */}
      {continueWatching.length > 0 && (
        <section>
          <h2 className="text-slate-900 text-base font-bold normal-case mb-3">Continuar assistindo</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {continueWatching.map((item) => (
              <Link
                key={item.lessonId}
                to={`/curso/${item.courseId}?lesson=${item.lessonId}`}
                className="flex-shrink-0 w-36 group"
              >
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-200/70">
                  {item.thumbnailUrl ? (
                    <img src={item.thumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-black/50 border border-white/70 backdrop-blur-sm flex items-center justify-center">
                      <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/40">
                    <div className="h-full bg-[var(--club-600)]" style={{ width: `${item.progressPercent}%` }} />
                  </div>
                </div>
                <p className="text-slate-900 text-xs font-semibold mt-1.5 line-clamp-1 normal-case">{item.courseTitle}</p>
                <p className="text-slate-500 text-[11px] line-clamp-1">{item.lessonTitle}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Em andamento */}
      {inProgress.length > 0 && (
        <section>
          <h2 className="text-slate-900 text-base font-bold normal-case mb-3">Em andamento</h2>
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
          <h2 className="text-slate-900 text-base font-bold normal-case mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[var(--club-600)]" /> Concluídos
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
          <h2 className="text-slate-900 text-base font-bold normal-case mb-3">Comece agora</h2>
          <div className="space-y-2">
            {notStarted.map((c) => (
              <CourseProgressRow key={c.courseId} {...c} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!isLoading && data && data.courses.length === 0 && (
        <div className="text-center py-8 px-4 border border-dashed border-slate-300 rounded-3xl bg-white">
          <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-slate-900 text-base font-bold mb-1 normal-case">Você ainda não possui cursos</h3>
          <p className="text-slate-500 text-sm mb-4">Comece sua trilha de consciência hoje mesmo.</p>
          <Link
            to="/cursos"
            className="inline-flex items-center gap-2 bg-[var(--club-600)] text-white text-sm font-semibold px-5 py-2.5 rounded-2xl"
          >
            Explorar FanatiClass <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Descobrir */}
      {discoverCourses.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-slate-900 text-base font-bold normal-case">Descobrir cursos</h2>
            <Link to="/cursos" className="text-[var(--club-600)] text-xs font-semibold flex items-center gap-1">
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
          <h2 className="text-slate-900 text-base font-bold normal-case mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--club-600)]" /> Em breve
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
      <div className="min-h-screen bg-white font-sans text-slate-900">
        <MeusCursosInfoCard />
        <Header title="Meus cursos" />
        <main className="pt-[calc(56px+1cm)] px-4 pb-32">
          <div className="mb-4">
            <h1 className="font-sans text-2xl font-extrabold tracking-tight normal-case">Meus Cursos</h1>
            <p className="text-sm text-slate-500 mt-1">Sua trilha de consciência</p>
          </div>
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