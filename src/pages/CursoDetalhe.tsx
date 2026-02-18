import { useState } from "react";
import { Play, ChevronLeft, Lock, Check, Plus, ThumbsUp, Share2, ChevronDown, Clock, BookOpen, CheckCircle } from "lucide-react";
import { Link, useParams } from "react-router-dom";
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
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"modulos" | "sobre">("modulos");
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-display text-white mb-2">Curso não encontrado</h2>
          <Link to="/cursos" className="text-white/70 hover:underline">Voltar aos cursos</Link>
        </div>
      </div>
    );
  }

  if (course.coming_soon) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-display text-white mb-2">Em breve</h2>
          <p className="text-muted-foreground text-sm mb-4">Este curso ainda não está disponível.</p>
          <Link to="/cursos" className="text-white/70 hover:underline">Voltar aos cursos</Link>
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
      <div className="relative aspect-video bg-black rounded-2xl overflow-hidden mb-6">
        {hasAccess && currentLesson?.video_url ? (
          <video
            ref={registerVideo}
            src={currentLesson.video_url}
            controls
            playsInline
            className="w-full h-full"
            poster={currentLesson.thumbnail_url || (course as any).grid_image_url || course.thumbnail_url || undefined}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-muted to-card flex flex-col items-center justify-center">
            {course.thumbnail_url ? (
              <img src={course.thumbnail_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
            ) : null}
            <div className="relative z-10 flex flex-col items-center">
              {!hasAccess && course.is_premium ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mb-3">
                    <Lock className="w-8 h-8 text-white/80" />
                  </div>
                  <p className="text-white/70 text-sm">Conteúdo bloqueado</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center mb-3">
                    <Play className="w-8 h-8 text-gray-800 fill-current ml-1" />
                  </div>
                  <p className="text-white/70 text-sm">
                    {currentLesson ? "Vídeo em breve" : "Selecione uma aula"}
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Course Info */}
      <div className="px-1">
        <span className="text-white font-bold text-xs tracking-widest uppercase">FANATICLASS</span>
        <h1 className="font-display text-2xl text-white mt-1 mb-2">{course.title}</h1>
        
        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4 flex-wrap">
          {course.instructor && <span>{course.instructor}</span>}
          {course.total_duration && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {course.total_duration}
            </span>
          )}
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" /> {totalLessons} aulas
          </span>
          {course.is_premium ? (
            <span className="bg-white/10 text-white px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
              <Lock className="w-3 h-3" /> Premium
            </span>
          ) : (
            <span className="bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full text-xs font-bold">
              Gratuito
            </span>
          )}
        </div>

        {/* Paywall - show if premium and no access */}
        {course.is_premium && !hasAccess ? (
          <CoursePaywall course={course} onAccessGranted={handleAccessGranted} />
        ) : (
        <>
        {/* Current Lesson Title */}
        {currentLesson && (
          <div className="bg-muted/50 rounded-xl p-3 mb-4 border border-border">
            <p className="text-xs text-muted-foreground mb-0.5">Assistindo agora</p>
            <p className="text-white font-medium text-sm">{currentLesson.title}</p>
            {currentLesson.duration && (
              <p className="text-xs text-muted-foreground mt-1">{currentLesson.duration}</p>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex justify-around border-b border-border pb-4 mb-4">
          <button className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-colors">
            <Plus className="w-5 h-5" />
            <span className="text-xs">Minha lista</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-colors">
            <ThumbsUp className="w-5 h-5" />
            <span className="text-xs">Avaliar</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-colors">
            <Share2 className="w-5 h-5" />
            <span className="text-xs">Compartilhar</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 mb-4">
          <button
            onClick={() => setActiveTab("modulos")}
            className={`pb-2 font-medium text-sm transition-colors ${
              activeTab === "modulos"
                ? "text-white border-b-2 border-white"
                : "text-muted-foreground"
            }`}
          >
            Módulos e Aulas
          </button>
          <button
            onClick={() => setActiveTab("sobre")}
            className={`pb-2 font-medium text-sm transition-colors ${
              activeTab === "sobre"
                ? "text-white border-b-2 border-white"
                : "text-muted-foreground"
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
                    <AccordionItem key={mod.id} value={mod.id} className="border border-border rounded-xl overflow-hidden">
                      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                        <div className="flex items-center gap-3 text-left">
                          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {modIdx + 1}
                          </div>
                          <div>
                            <h3 className="text-white font-medium text-sm">{mod.title}</h3>
                            <p className="text-muted-foreground text-xs">{modLessons.length} aulas</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-0 pb-0">
                        <div className="border-t border-border">
                          {modLessons.map((lesson, lesIdx) => (
                            <button
                              key={lesson.id}
                              onClick={() => setSelectedLessonId(lesson.id)}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border last:border-b-0 ${
                                currentLesson?.id === lesson.id ? "bg-white/5" : ""
                              }`}
                            >
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                                currentLesson?.id === lesson.id
                                  ? "bg-white text-gray-800"
                                  : "bg-muted text-muted-foreground"
                              }`}>
                                {currentLesson?.id === lesson.id ? (
                                  <Play className="w-3 h-3 fill-current ml-0.5" />
                                ) : (
                                  lesIdx + 1
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-white text-sm font-medium line-clamp-1">{lesson.title}</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {lesson.duration && (
                                    <span className="text-muted-foreground text-xs">{lesson.duration}</span>
                                  )}
                                  {lesson.is_free && (
                                    <span className="text-green-600 text-xs font-medium">Grátis</span>
                                  )}
                                </div>
                              </div>
                              {!lesson.is_free && course.is_premium && (
                                <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
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
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Conteúdo em breve</p>
              </div>
            )}

            {/* Activities Section */}
            {currentLesson && activities && activities.length > 0 && (
              <div className="mt-6 pt-4 border-t border-border">
                <h3 className="font-display text-lg text-white mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-white" />
                  Atividades Complementares
                </h3>
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="bg-muted/50 border border-border rounded-xl p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div>
                          <h4 className="text-white font-medium text-sm">{activity.title}</h4>
                          {activity.description && (
                            <p className="text-muted-foreground text-xs mt-1">{activity.description}</p>
                          )}
                          {activity.is_required && (
                            <span className="text-xs text-white font-medium mt-2 inline-block">Obrigatória</span>
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
                <h3 className="text-white font-medium mb-2">Descrição</h3>
                <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                  {course.description}
                </p>
              </div>
            )}
            {course.instructor && (
              <div>
                <h3 className="text-white font-medium mb-1">Instrutor</h3>
                <p className="text-muted-foreground text-sm">{course.instructor}</p>
              </div>
            )}
            <div>
              <h3 className="text-white font-medium mb-1">Categoria</h3>
              <p className="text-muted-foreground text-sm">{course.category}</p>
            </div>
            {course.price !== null && course.price > 0 && (
              <div>
                <h3 className="text-white font-medium mb-1">Preço</h3>
                <p className="text-white font-bold">R$ {Number(course.price).toFixed(2).replace('.', ',')}</p>
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
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-[calc(env(safe-area-inset-top)+64px)] px-4 pb-4">
          <div className="mb-4">
        <Link to="/cursos" className="flex items-center gap-1 text-muted-foreground text-sm hover:text-white transition-colors">
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
        <Link to="/cursos" className="flex items-center gap-1 text-muted-foreground text-sm hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" /> Voltar aos cursos
        </Link>
      </div>
      <DetailContent />
    </UserDesktopLayout>
  );
};

export default CursoDetalhe;
