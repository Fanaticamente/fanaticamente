import { useState } from "react";
import { Play, ChevronRight, Search, Plus, ChevronDown, Lock, Star, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import UserDesktopLayout from "@/components/layout/UserDesktopLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCourses, type Course } from "@/hooks/useCourses";
import { Skeleton } from "@/components/ui/skeleton";

const categories = ["Todos", "Saúde Mental", "Resiliência", "Autoconhecimento", "Bem-estar", "Relacionamentos"];

const Cursos = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const isMobile = useIsMobile();
  const { data: courses, isLoading } = useCourses();

  const filteredCourses = courses?.filter(c => {
    const matchCat = selectedCategory === "Todos" || c.category === selectedCategory;
    const matchSearch = !searchTerm || c.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  }) || [];

  const featuredCourse = filteredCourses[0];
  const premiumCourses = filteredCourses.filter(c => c.is_premium);
  const freeCourses = filteredCourses.filter(c => !c.is_premium);

  const CourseCard = ({ course, size = "normal" }: { course: Course; size?: "normal" | "small" }) => (
    <Link
      to={`/curso/${course.id}`}
      className={`flex-shrink-0 group ${size === "small" ? (isMobile ? "w-32" : "w-40") : (isMobile ? "w-36" : "w-48")}`}
    >
      <div className={`relative ${size === "small" ? "aspect-[2/3]" : "aspect-video"} rounded-xl overflow-hidden bg-muted mb-2`}>
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} alt={course.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-secondary/30 flex items-center justify-center">
            <Play className="w-8 h-8 text-white/50" />
          </div>
        )}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          {course.is_premium && (
            <div className="bg-white text-gray-800 text-xs font-bold py-0.5 px-2 rounded-full flex items-center gap-1">
              <Lock className="w-3 h-3" />
              PRO
            </div>
          )}
          {course.coming_soon && (
            <div className="bg-amber-500 text-white text-xs font-bold py-0.5 px-2 rounded-full flex items-center gap-1">
              <Clock className="w-3 h-3" />
              EM BREVE
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
            <Play className="w-5 h-5 text-gray-800 fill-current ml-0.5" />
          </div>
        </div>
      </div>
      <h3 className="text-white text-sm font-medium line-clamp-2">{course.title}</h3>
      {course.instructor && (
        <p className="text-muted-foreground text-xs mt-0.5">{course.instructor}</p>
      )}
    </Link>
  );

  const CursosContent = () => (
    <>
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar cursos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-muted rounded-xl text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/50"
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
                ? "bg-white text-gray-800 border-white shadow-sm"
                : "bg-transparent border-border text-white hover:bg-muted"
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
          <Play className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Nenhum curso disponível</h3>
          <p className="text-muted-foreground text-sm">Em breve novos conteúdos serão adicionados.</p>
        </div>
      ) : (
        <>
          {/* Featured Hero */}
          {featuredCourse && (
            <div className="mb-8">
              <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-b from-muted to-card ${isMobile ? "aspect-[4/5] max-h-[500px]" : "aspect-[21/9]"}`}>
                {(featuredCourse.hero_image_url || featuredCourse.thumbnail_url) ? (
                  <img src={featuredCourse.hero_image_url || featuredCourse.thumbnail_url!} alt="" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-secondary/30" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                <div className={`absolute bottom-0 left-0 right-0 p-6 ${!isMobile ? "max-w-2xl" : ""}`}>
                  <span className="text-white font-bold text-xs tracking-widest uppercase mb-2 block">FANATICLASS</span>
                  <h2 className="font-display text-3xl text-white mb-2 leading-tight">
                    {featuredCourse.title}
                  </h2>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {featuredCourse.description}
                  </p>
                  <div className="flex gap-3">
                    <Link
                      to={`/curso/${featuredCourse.id}`}
                      className="flex items-center gap-2 py-3 px-6 bg-white text-gray-800 rounded-xl font-medium hover:bg-gray-100 transition-colors"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      Assistir
                    </Link>
                    <button className="flex items-center gap-2 py-3 px-6 bg-muted/80 text-white rounded-xl font-medium hover:bg-muted transition-colors">
                      <Plus className="w-5 h-5" />
                      Minha lista
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Free Courses */}
          {freeCourses.length > 0 && (
            <div className="mb-8">
              <h2 className="font-display text-xl text-white mb-4">
                🎓 Gratuitos
              </h2>
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
              <h2 className="font-display text-xl text-white mb-4">
                Conteúdo Premium
              </h2>
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
              <h2 className="font-display text-xl text-white mb-4">
                Todos os cursos
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredCourses.map((course) => (
                  <Link
                    key={course.id}
                    to={`/curso/${course.id}`}
                    className="group"
                  >
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-muted mb-2">
                      {(course.grid_image_url || course.thumbnail_url) ? (
                        <img src={course.grid_image_url || course.thumbnail_url!} alt={course.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-secondary/20 flex items-center justify-center">
                          <Play className="w-8 h-8 text-white/40" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                        {course.is_premium && (
                          <div className="bg-white text-gray-800 text-xs font-bold py-0.5 px-2 rounded-full flex items-center gap-1">
                            <Lock className="w-3 h-3" /> PRO
                          </div>
                        )}
                        {course.coming_soon && (
                          <div className="bg-amber-500 text-white text-xs font-bold py-0.5 px-2 rounded-full flex items-center gap-1">
                            <Clock className="w-3 h-3" /> EM BREVE
                          </div>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h3 className="text-white text-sm font-medium line-clamp-2">{course.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {course.instructor && <span className="text-muted-foreground text-xs">{course.instructor}</span>}
                      {course.total_duration && (
                        <span className="text-muted-foreground text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {course.total_duration}
                        </span>
                      )}
                    </div>
                  </Link>
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
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16 px-4">
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
