import { useState } from "react";
import { Play, ChevronRight, Search, Plus, ChevronDown, Lock, Star, Clock, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import UserDesktopLayout from "@/components/layout/UserDesktopLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCourses, type Course } from "@/hooks/useCourses";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserCourseAccess } from "@/hooks/useUserCourseAccess";
import { useRadio } from "@/contexts/RadioContext";
import { useContinueWatching } from "@/hooks/useContinueWatching";

const categories = ["Todos", "Saúde Mental", "Resiliência", "Autoconhecimento", "Bem-estar", "Relacionamentos"];

// Normalize DB titles that come in ALL CAPS to sentence-case for display.
const displayTitle = (t?: string | null) => {
  if (!t) return "";
  const stripped = t.replace(/[\s\W]/g, "");
  const isAllCaps = stripped.length > 0 && stripped === stripped.toUpperCase() && /[A-ZÀ-Ú]/.test(stripped);
  if (!isAllCaps) return t;
  const lower = t.toLocaleLowerCase("pt-BR");
  return lower.charAt(0).toLocaleUpperCase("pt-BR") + lower.slice(1);
};

const Cursos = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const isMobile = useIsMobile();
  const { data: courses, isLoading } = useCourses();
  const { data: accessData } = useUserCourseAccess();
  const { playingStation } = useRadio();
  const { items: continueWatching } = useContinueWatching();

  const hasAccessToCourse = (courseId: string, isPremium: boolean) => {
    if (!isPremium) return true;
    if (!accessData) return false;
    if (accessData.hasMembership) return true;
    return accessData.accessibleIds.has(courseId);
  };

  const filteredCourses = courses?.filter(c => {
    const matchCat = selectedCategory === "Todos" || c.category === selectedCategory;
    const matchSearch = !searchTerm || c.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  }) || [];

  const featuredCourse = filteredCourses.find(c => (c as any).is_featured) || filteredCourses[0];
  const premiumCourses = filteredCourses.filter(c => c.is_premium);
  const freeCourses = filteredCourses.filter(c => !c.is_premium);

  const CourseCard = ({ course, size = "normal" }: { course: Course; size?: "normal" | "small" }) => {
    const content = (
      <>
        <div className={`relative ${size === "small" ? "aspect-[2/3]" : "aspect-video"} rounded-xl overflow-hidden bg-slate-100 mb-2`}>
          {course.thumbnail_url ? (
            <img src={course.thumbnail_url} alt={course.title} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-secondary/30 flex items-center justify-center">
              <Play className="w-8 h-8 text-white/50" />
            </div>
          )}
          <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
            {course.is_premium && (
              hasAccessToCourse(course.id, course.is_premium) ? (
                <div className="bg-green-500 text-white text-xs font-bold py-0.5 px-2 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  DISPONÍVEL
                </div>
              ) : (
                <div className="bg-white text-gray-800 text-xs font-bold py-0.5 px-2 rounded-full flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  PRO
                </div>
              )
            )}
          </div>
          {course.coming_soon && (
            <div className="absolute bottom-2 right-2 bg-amber-500 text-white text-xs font-bold py-0.5 px-2 rounded-full flex items-center gap-1">
              <Clock className="w-3 h-3" />
              EM BREVE
            </div>
          )}
          {!course.coming_soon && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                <Play className="w-5 h-5 text-gray-800 fill-current ml-0.5" />
              </div>
            </div>
          )}
        </div>
        <h3 className="text-slate-900 text-sm font-semibold line-clamp-2 normal-case">{displayTitle(course.title)}</h3>
        {course.instructor && (
          <p className="text-slate-500 text-xs mt-0.5">{course.instructor}</p>
        )}
      </>
    );

    if (course.coming_soon) {
      return (
        <div className={`flex-shrink-0 group cursor-default opacity-70 ${size === "small" ? (isMobile ? "w-32" : "w-40") : (isMobile ? "w-36" : "w-48")}`}>
          {content}
        </div>
      );
    }

    return (
      <Link
        to={`/curso/${course.id}`}
        className={`flex-shrink-0 group ${size === "small" ? (isMobile ? "w-32" : "w-40") : (isMobile ? "w-36" : "w-48")}`}
      >
        {content}
      </Link>
    );
  };

  const GridCourseCard = ({ course }: { course: Course }) => {
    const content = (
      <>
        <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 mb-2">
          {(course.grid_image_url || course.thumbnail_url) ? (
            <img src={course.grid_image_url || course.thumbnail_url!} alt={course.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-secondary/20 flex items-center justify-center">
              <Play className="w-8 h-8 text-white/40" />
            </div>
          )}
          <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
            {course.is_premium && (
              hasAccessToCourse(course.id, course.is_premium) ? (
                <div className="bg-green-500 text-white text-xs font-bold py-0.5 px-2 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  DISPONÍVEL
                </div>
              ) : (
                <div className="bg-white text-gray-800 text-xs font-bold py-0.5 px-2 rounded-full flex items-center gap-1">
                  <Lock className="w-3 h-3" /> PRO
                </div>
              )
            )}
          </div>
          {course.coming_soon && (
            <div className="absolute bottom-2 right-2 bg-amber-500 text-white text-xs font-bold py-0.5 px-2 rounded-full flex items-center gap-1">
              <Clock className="w-3 h-3" /> EM BREVE
            </div>
          )}
          {!course.coming_soon && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
        <h3 className="text-slate-900 text-sm font-semibold line-clamp-2 normal-case">{displayTitle(course.title)}</h3>
        <div className="flex items-center gap-2 mt-1">
          {course.instructor && <span className="text-slate-500 text-xs">{course.instructor}</span>}
          {course.total_duration && (
            <span className="text-slate-500 text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" /> {course.total_duration}
            </span>
          )}
        </div>
      </>
    );

    if (course.coming_soon) {
      return (
        <div key={course.id} className="group cursor-default opacity-70">
          {content}
        </div>
      );
    }

    return (
      <Link key={course.id} to={`/curso/${course.id}`} className="group">
        {content}
      </Link>
    );
  };

  const CursosContent = () => (
    <>
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Buscar cursos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-100 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--club-500)]/40"
        />
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors border ${
              selectedCategory === cat
                ? "bg-[var(--club-600)] text-white border-[var(--club-600)]"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="w-full aspect-video rounded-2xl" />
          <div className="flex gap-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="w-40 aspect-[2/3] rounded-xl" />)}
          </div>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-20">
          <Play className="w-16 h-16 text-slate-500/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Nenhum curso disponível</h3>
          <p className="text-slate-500 text-sm">Em breve novos conteúdos serão adicionados.</p>
        </div>
      ) : (
        <>
          {/* Featured Hero */}
          {featuredCourse && (
            <div className="mb-8">
              <div className={`relative rounded-2xl overflow-hidden bg-slate-100 ${isMobile ? "aspect-video" : "aspect-[21/9]"}`}>
                {(featuredCourse.hero_image_url || featuredCourse.thumbnail_url) ? (
                  <img src={featuredCourse.hero_image_url || featuredCourse.thumbnail_url!} alt="" className="absolute inset-0 w-full h-full object-cover object-top" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-secondary/30" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className={`absolute bottom-0 left-0 right-0 p-5 ${!isMobile ? "max-w-2xl" : ""}`}>
                  <span className="text-white/90 font-semibold text-[11px] tracking-widest uppercase mb-1 block">Destaque</span>
                  <h2 className="font-sans text-2xl text-white normal-case mb-2 leading-tight font-bold">
                    {displayTitle(featuredCourse.title)}
                  </h2>
                  <div className="flex gap-2 mt-3">
                    {featuredCourse.coming_soon ? (
                      <div className="flex items-center gap-2 py-2.5 px-5 bg-amber-500 text-white rounded-full text-sm font-semibold">
                        <Clock className="w-4 h-4" />
                        Em breve
                      </div>
                    ) : (
                      <Link
                        to={`/curso/${featuredCourse.id}`}
                        className="flex items-center gap-2 py-2.5 px-5 bg-[var(--club-500)] text-white rounded-full text-sm font-semibold hover:bg-[var(--club-600)] transition-colors"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        Assistir
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Continue Watching — aparece após o hero */}
          {continueWatching.length > 0 && (
            <div className="mb-8">
              <h2 className="font-sans text-lg text-slate-900 normal-case mb-3 font-semibold">Continuar assistindo</h2>
              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                {continueWatching.map((item) => (
                  <Link
                    key={item.lessonId}
                    to={`/curso/${item.courseId}?lesson=${item.lessonId}`}
                    className={`flex-shrink-0 group ${isMobile ? "w-40" : "w-52"}`}
                  >
                    <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-slate-100">
                      {item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.lessonTitle}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-secondary/30" />
                      )}
                      {/* Dark overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      {/* Play button */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full border-2 border-white/80 bg-black/40 flex items-center justify-center backdrop-blur-sm group-hover:bg-black/60 transition-colors">
                          <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                        <div
                          className="h-full bg-white transition-all"
                          style={{ width: `${item.progressPercent}%` }}
                        />
                      </div>
                    </div>
                    <div className="mt-2 px-0.5">
                      <p className="text-slate-900 text-xs font-semibold line-clamp-1 normal-case">{displayTitle(item.courseTitle)}</p>
                      <p className="text-slate-500 text-xs line-clamp-1 mt-0.5 normal-case">{displayTitle(item.lessonTitle)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Free Courses */}
          {freeCourses.length > 0 && (
            <div className="mb-8">
              <h2 className="font-sans text-lg text-slate-900 normal-case mb-3 font-semibold">Gratuitos</h2>
              <div className={`flex gap-3 overflow-x-auto pb-4 scrollbar-hide ${!isMobile ? "flex-wrap" : ""}`}>
                {freeCourses.map((course) => (
                  <CourseCard key={course.id} course={course} size="small" />
                ))}
              </div>
            </div>
          )}

          {/* Premium Courses */}
          {premiumCourses.length > 0 && (
            <div className="mb-8">
              <h2 className="font-sans text-lg text-slate-900 normal-case mb-3 font-semibold">Conteúdo premium</h2>
              <div className={`flex gap-3 overflow-x-auto pb-4 scrollbar-hide ${!isMobile ? "flex-wrap" : ""}`}>
                {premiumCourses.map((course) => (
                  <CourseCard key={course.id} course={course} size="small" />
                ))}
              </div>
            </div>
          )}

          {/* All Courses Grid */}
          {filteredCourses.length > 1 && (
            <div className="mb-8">
              <h2 className="font-sans text-lg text-slate-900 normal-case mb-3 font-semibold">Todos os cursos</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredCourses.map((course) => (
                  <GridCourseCard key={course.id} course={course} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-white">
        <Header title="FanatiClass" />
        <main className={`${playingStation ? 'pt-[calc(env(safe-area-inset-top)+112px)]' : 'pt-[calc(env(safe-area-inset-top)+64px)]'} px-4`}>
          <CursosContent />
          <div aria-hidden className="h-28" />
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <UserDesktopLayout title="FanatiClass" subtitle="Cursos exclusivos sobre saúde mental e futebol">
      <CursosContent />
    </UserDesktopLayout>
  );
};

export default Cursos;