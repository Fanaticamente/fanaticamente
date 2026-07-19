import { useState } from "react";
import { Play, ChevronLeft, Lock, Check, Plus, ThumbsUp, Share2, ChevronDown, Clock, BookOpen, CheckCircle } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import UserDesktopLayout from "@/components/layout/UserDesktopLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCourse, useCourseModules, useCourseLessons, useLessonActivities } from "@/hooks/useCourses";
import { useCourseAccess } from "@/hooks/useCourseAccess";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import CoursePaywall from "@/components/courses/CoursePaywall";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useVideoProgress } from "@/hooks/useVideoProgress";

const CursoDetalhe = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"modulos" | "sobre">("modulos");
  const initialLessonId = searchParams.get("lesson");
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(initialLessonId);

  const { data: course, isLoading: loadingCourse } = useCourse(id);
  const { data: accessData, isLoading: loadingAccess } = useCourseAccess(id);
  const { data: modules, isLoading: loadingModules } = useCourseModules(id);
  const { data: allLessons } = useCourseLessons(id);
  const { data: activities } = useLessonActivities(selectedLessonId || undefined);

  // Persist video position across app switches
  const currentLessonId = selectedLessonId ?? (allLessons?.[0]?.id ?? undefined);
  const { registerVideo } = useVideoProgress(currentLessonId);

  const hasAccess = !course?.is_premium || accessData?.hasAccess === true;

  const handleAccessGranted = () => {
    queryClient.invalidateQueries({ queryKey: ["course-access", id] });
  };

  const currentLesson = selectedLessonId ? allLessons?.find(l => l.id === selectedLessonId) : allLessons?.[0];

  if (loadingCourse) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-sans font-semibold text-slate-900 mb-2">Curso não encontrado</h2>
          <Link to="/cursos" className="text-emerald-600 hover:underline">Voltar aos cursos</Link>
        </div>
      </div>
    );
  }

  if (course.coming_soon) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-sans font-semibold text-slate-900 mb-2">Em breve</h2>
          <p className="text-slate-500 text-sm mb-4">Este curso ainda não está disponível.</p>
          <Link to="/cursos" className="text-emerald-600 hover:underline">Voltar aos cursos</Link>
        </div>
      </div>
    );
  }

  const getLessonsForModule = (moduleId: string) => {
    return allLessons?.filter(l => l.module_id === moduleId) || [];
  };

  const totalLessons = allLessons?.length || 0;

  const DetailContent = () => (
    <div className="max-w-4xl mx-auto">
      {/* Video Player / Locked Thumbnail */}
      <div className="relative aspect-video bg-black rounded-2xl overflow-hidden mb-4">
        {hasAccess && currentLesson?.video_url ? (
          <video
            key={currentLesson.id}
            ref={registerVideo}
            src={currentLesson.video_url}
            controls
            playsInline
            className="w-full h-full object-contain"
            poster={currentLesson.thumbnail_url || (course as any).grid_image_url || course.thumbnail_url || undefined}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-700 flex flex-col items-center justify-center">
            {course.thumbnail_url ? (
              <img src={course.thumbnail_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
            ) : null}
            <div className="absolute inset-0 bg-black/25" />
            <div className="relative z-10 flex flex-col items-center">
              {!hasAccess && course.is_premium ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center mb-3">
                    <Lock className="w-8 h-8 text-slate-700" />
                  </div>
                  <p className="text-white/90 text-sm">Conteúdo bloqueado</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                    <Play className="w-8 h-8 text-white fill-current ml-1" />
                  </div>
                </>
              )}
            </div>
            {/* Meta chips */}
            <div className="absolute bottom-3 left-3 right-3 z-10 flex gap-2 flex-wrap">
              {course.instructor && (
                <span className="px-3 py-1 rounded-full border border-emerald-400 text-emerald-300 text-[11px] font-semibold bg-black/30 backdrop-blur-sm">
                  {course.instructor}
                </span>
              )}
              <span className="px-3 py-1 rounded-full border border-emerald-400 text-emerald-300 text-[11px] font-semibold bg-black/30 backdrop-blur-sm inline-flex items-center gap-1">
                <BookOpen className="w-3 h-3" /> {totalLessons} aulas
              </span>
              {course.total_duration && (
                <span className="px-3 py-1 rounded-full border border-emerald-400 text-emerald-300 text-[11px] font-semibold bg-black/30 backdrop-blur-sm inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {course.total_duration}
                </span>
              )}
              <span className="px-3 py-1 rounded-full border border-emerald-400 text-emerald-300 text-[11px] font-semibold bg-black/30 backdrop-blur-sm">
                {course.is_premium ? "Premium" : "Gratuito"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Course Info */}
      <div className="px-1">
        <h1 className="font-sans font-bold text-xl text-slate-900 normal-case mb-3 mt-2">{course.title}</h1>

        {/* Paywall - show if premium and no access */}
        {course.is_premium && !hasAccess ? (
          <CoursePaywall course={course} onAccessGranted={handleAccessGranted} />
        ) : (
        <>
        {/* Current Lesson Title */}
        {currentLesson && (
          <div className="bg-slate-50 rounded-xl p-3 mb-4 border border-slate-200">
            <p className="text-xs text-slate-500 mb-0.5">Assistindo agora</p>
            <p className="text-slate-900 font-semibold text-sm">{currentLesson.title}</p>
            {currentLesson.duration && (
              <p className="text-xs text-slate-500 mt-1">{currentLesson.duration}</p>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-6 mb-5 border-b border-slate-200">
          <button
            onClick={() => setActiveTab("modulos")}
            className={`pb-3 font-semibold text-sm transition-colors -mb-px ${
              activeTab === "modulos"
                ? "text-emerald-600 border-b-2 border-emerald-600"
                : "text-slate-500 border-b-2 border-transparent"
            }`}
          >
            Módulos e aulas
          </button>
          <button
            onClick={() => setActiveTab("sobre")}
            className={`pb-3 font-semibold text-sm transition-colors -mb-px ${
              activeTab === "sobre"
                ? "text-emerald-600 border-b-2 border-emerald-600"
                : "text-slate-500 border-b-2 border-transparent"
            }`}
          >
            Sobre
          </button>
        </div>

        {/* Modules Tab */}
        {activeTab === "modulos" && (
          <div className="space-y-2">
            {loadingModules ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
              </div>
            ) : modules && modules.length > 0 ? (
              <Accordion type="multiple" className="space-y-2">
                {modules.map((mod, modIdx) => {
                  const modLessons = getLessonsForModule(mod.id);
                  return (
                    <AccordionItem key={mod.id} value={mod.id} className="border border-slate-200 rounded-xl overflow-hidden">
                      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50">
                        <div className="flex items-center gap-3 text-left">
                          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-slate-900 font-bold text-sm flex-shrink-0">
                            {modIdx + 1}
                          </div>
                          <div>
                            <h3 className="text-slate-900 font-semibold text-sm">{mod.title}</h3>
                            <p className="text-slate-500 text-xs">{modLessons.length} aulas</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-0 pb-0">
                        <div className="border-t border-slate-200">
                          {modLessons.map((lesson, lesIdx) => (
                            <button
                              key={lesson.id}
                              onClick={() => setSelectedLessonId(lesson.id)}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-200 last:border-b-0 ${
                                currentLesson?.id === lesson.id ? "bg-white/5" : ""
                              }`}
                            >
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                                currentLesson?.id === lesson.id
                                  ? "bg-emerald-500 text-white"
                                  : "bg-slate-100 text-slate-500"
                              }`}>
                                {currentLesson?.id === lesson.id ? (
                                  <Play className="w-3 h-3 fill-current ml-0.5" />
                                ) : (
                                  lesIdx + 1
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-slate-900 text-sm font-semibold line-clamp-1">{lesson.title}</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {lesson.duration && (
                                    <span className="text-slate-500 text-xs">{lesson.duration}</span>
                                  )}
                                  {lesson.is_free && (
                                    <span className="text-green-600 text-xs font-medium">Grátis</span>
                                  )}
                                </div>
                              </div>
                              {!lesson.is_free && course.is_premium && (
                                <Lock className="w-4 h-4 text-slate-500 flex-shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Conteúdo em breve</p>
              </div>
            )}

            {/* Activities Section */}
            {currentLesson && activities && activities.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-200">
                <h3 className="font-sans text-lg text-slate-900 normal-case mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  Atividades Complementares
                </h3>
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <div>
                          <h4 className="text-slate-900 font-semibold text-sm">{activity.title}</h4>
                          {activity.description && (
                            <p className="text-slate-500 text-xs mt-1">{activity.description}</p>
                          )}
                          {activity.is_required && (
                            <span className="text-xs text-emerald-600 font-semibold mt-2 inline-block">Obrigatória</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* About Tab */}
        {activeTab === "sobre" && (
          <div className="space-y-4">
            {course.description && (
              <div>
                <h3 className="text-slate-900 font-semibold mb-2">Descrição</h3>
                <p className="text-slate-500 text-sm leading-relaxed whitespace-pre-wrap">
                  {course.description}
                </p>
              </div>
            )}
            {course.instructor && (
              <div>
                <h3 className="text-slate-900 font-semibold mb-1">Instrutor</h3>
                <p className="text-slate-500 text-sm">{course.instructor}</p>
              </div>
            )}
            <div>
              <h3 className="text-slate-900 font-semibold mb-1">Categoria</h3>
              <p className="text-slate-500 text-sm">{course.category}</p>
            </div>
            {course.price !== null && course.price > 0 && (
              <div>
                <h3 className="text-slate-900 font-semibold mb-1">Preço</h3>
                <p className="text-slate-900 font-bold">R$ {Number(course.price).toFixed(2).replace('.', ',')}</p>
              </div>
            )}
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-white">
        <Header title={course?.title || "Curso"} hideSearch />
        <main className="pt-[calc(env(safe-area-inset-top)+64px)] px-4 pb-4">
          <div className="mb-4">
        <Link to="/cursos" className="flex items-center gap-1 text-slate-500 text-sm hover:text-slate-700 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Voltar
            </Link>
          </div>
          <DetailContent />
          <div aria-hidden className="h-28" />
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <UserDesktopLayout title={course.title} subtitle="FanatiClass">
      <div className="mb-4">
        <Link to="/cursos" className="flex items-center gap-1 text-slate-500 text-sm hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" /> Voltar aos cursos
        </Link>
      </div>
      <DetailContent />
    </UserDesktopLayout>
  );
};

export default CursoDetalhe;
