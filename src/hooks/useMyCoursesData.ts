import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MyCourseSummary {
  courseId: string;
  title: string;
  thumbnailUrl: string | null;
  category: string;
  instructor: string | null;
  totalLessons: number;
  completedLessons: number;
  inProgressLessons: number;
  progressPercent: number;
  status: "not_started" | "in_progress" | "completed";
  accessType: string | null;
  lastActivityAt: string | null;
}

export interface MyCoursesData {
  courses: MyCourseSummary[];
  totalCompletedLessons: number;
  totalLessonsAcrossAccessibleCourses: number;
  totalCompletedCourses: number;
  totalInProgressCourses: number;
  totalAccessibleCourses: number;
  hasMembership: boolean;
  /** 0-100 consciousness level percentage within current rank */
  consciousnessPercent: number;
  /** Cumulative points (lessons*10 + completed courses*100) */
  consciousnessPoints: number;
  /** Current rank label */
  rankLabel: string;
  /** Points needed for next rank (0 = max rank) */
  pointsToNextRank: number;
  nextRankLabel: string | null;
}

const RANKS: Array<{ label: string; min: number }> = [
  { label: "Iniciante", min: 0 },
  { label: "Curioso", min: 80 },
  { label: "Engajado", min: 250 },
  { label: "Consciente", min: 600 },
  { label: "Fanático Consciente", min: 1500 },
];

const computeRank = (points: number) => {
  let currentIdx = 0;
  for (let i = 0; i < RANKS.length; i++) {
    if (points >= RANKS[i].min) currentIdx = i;
  }
  const current = RANKS[currentIdx];
  const next = RANKS[currentIdx + 1] ?? null;
  if (!next) {
    return {
      rankLabel: current.label,
      nextRankLabel: null,
      pointsToNextRank: 0,
      consciousnessPercent: 100,
    };
  }
  const range = next.min - current.min;
  const within = points - current.min;
  const pct = Math.max(0, Math.min(100, Math.round((within / range) * 100)));
  return {
    rankLabel: current.label,
    nextRankLabel: next.label,
    pointsToNextRank: Math.max(0, next.min - points),
    consciousnessPercent: pct,
  };
};

export const useMyCoursesData = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-courses-data", user?.id],
    queryFn: async (): Promise<MyCoursesData> => {
      const empty: MyCoursesData = {
        courses: [],
        totalCompletedLessons: 0,
        totalLessonsAcrossAccessibleCourses: 0,
        totalCompletedCourses: 0,
        totalInProgressCourses: 0,
        totalAccessibleCourses: 0,
        hasMembership: false,
        consciousnessPercent: 0,
        consciousnessPoints: 0,
        rankLabel: "Iniciante",
        pointsToNextRank: RANKS[1].min,
        nextRankLabel: RANKS[1].label,
      };
      if (!user) return empty;

      // 1. Active membership grants access to everything
      const { data: membership } = await supabase
        .from("user_memberships")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString())
        .limit(1)
        .maybeSingle();
      const hasMembership = !!membership;

      // 2. Individual course access
      const { data: accessRows } = await supabase
        .from("user_course_access")
        .select("course_id, access_type, expires_at, created_at");

      const now = new Date();
      const accessMap = new Map<string, { type: string; created_at: string }>();
      accessRows?.forEach((r) => {
        if (!r.expires_at || new Date(r.expires_at) > now) {
          accessMap.set(r.course_id, { type: r.access_type, created_at: r.created_at });
        }
      });

      // 3. Lesson progress
      const { data: progressRows } = await supabase
        .from("user_lesson_progress")
        .select("lesson_id, progress_percent, completed, updated_at")
        .eq("user_id", user.id);

      const progressByLesson = new Map(
        (progressRows ?? []).map((p) => [p.lesson_id, p])
      );

      // 4. Fetch all courses (need full catalog because membership grants all)
      const { data: allCourses } = await supabase
        .from("courses")
        .select("id, title, thumbnail_url, category, instructor, is_premium, coming_soon")
        .order("order_index");

      if (!allCourses?.length) return empty;

      // Accessible course set
      const accessibleCourseIds = new Set<string>();
      allCourses.forEach((c) => {
        if (!c.is_premium) accessibleCourseIds.add(c.id);
        else if (hasMembership || accessMap.has(c.id)) accessibleCourseIds.add(c.id);
      });

      // 5. Modules & lessons for accessible courses
      const courseIdList = Array.from(accessibleCourseIds);
      let lessonsByCourse = new Map<string, string[]>();
      if (courseIdList.length) {
        const { data: modules } = await supabase
          .from("course_modules")
          .select("id, course_id")
          .in("course_id", courseIdList);
        const moduleToCourse = new Map<string, string>(
          (modules ?? []).map((m) => [m.id, m.course_id])
        );
        const moduleIds = (modules ?? []).map((m) => m.id);
        if (moduleIds.length) {
          const { data: lessons } = await supabase
            .from("course_lessons")
            .select("id, module_id")
            .in("module_id", moduleIds);
          lessons?.forEach((l) => {
            const cid = moduleToCourse.get(l.module_id);
            if (!cid) return;
            const arr = lessonsByCourse.get(cid) ?? [];
            arr.push(l.id);
            lessonsByCourse.set(cid, arr);
          });
        }
      }

      // 6. Build summaries
      let totalCompletedLessons = 0;
      let totalLessonsAcrossAccessibleCourses = 0;
      let totalCompletedCourses = 0;
      let totalInProgressCourses = 0;

      const summaries: MyCourseSummary[] = [];
      for (const c of allCourses) {
        if (!accessibleCourseIds.has(c.id)) continue;
        const lessonIds = lessonsByCourse.get(c.id) ?? [];
        const totalLessons = lessonIds.length;
        let completed = 0;
        let inProgress = 0;
        let lastActivity: string | null = null;
        lessonIds.forEach((lid) => {
          const p = progressByLesson.get(lid);
          if (!p) return;
          if (p.completed) completed++;
          else if ((p.progress_percent ?? 0) > 0) inProgress++;
          if (p.updated_at && (!lastActivity || p.updated_at > lastActivity)) {
            lastActivity = p.updated_at;
          }
        });
        totalLessonsAcrossAccessibleCourses += totalLessons;
        totalCompletedLessons += completed;
        const progressPercent = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;
        let status: MyCourseSummary["status"] = "not_started";
        if (totalLessons > 0 && completed === totalLessons) {
          status = "completed";
          totalCompletedCourses++;
        } else if (completed > 0 || inProgress > 0) {
          status = "in_progress";
          totalInProgressCourses++;
        }
        summaries.push({
          courseId: c.id,
          title: c.title,
          thumbnailUrl: c.thumbnail_url,
          category: c.category,
          instructor: c.instructor,
          totalLessons,
          completedLessons: completed,
          inProgressLessons: inProgress,
          progressPercent,
          status,
          accessType: hasMembership ? "membership" : (accessMap.get(c.id)?.type ?? (c.is_premium ? null : "free")),
          lastActivityAt: lastActivity,
        });
      }

      // Order: in_progress first (by last activity), then completed, then not started
      summaries.sort((a, b) => {
        const order = { in_progress: 0, completed: 1, not_started: 2 } as const;
        if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
        return (b.lastActivityAt ?? "").localeCompare(a.lastActivityAt ?? "");
      });

      const consciousnessPoints = totalCompletedLessons * 10 + totalCompletedCourses * 100;
      const rankInfo = computeRank(consciousnessPoints);

      return {
        courses: summaries,
        totalCompletedLessons,
        totalLessonsAcrossAccessibleCourses,
        totalCompletedCourses,
        totalInProgressCourses,
        totalAccessibleCourses: accessibleCourseIds.size,
        hasMembership,
        consciousnessPoints,
        ...rankInfo,
      };
    },
    enabled: !!user,
    staleTime: 30_000,
  });
};

export const CONSCIOUSNESS_RANKS = RANKS;