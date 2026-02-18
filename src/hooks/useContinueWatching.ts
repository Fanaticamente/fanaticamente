import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_PREFIX = "fanatica_video_progress_";
// Stores "currentTime/duration" so we can compute accurate % without DB duration string
const DURATION_PREFIX = "fanatica_video_duration_";

export interface ContinueWatchingItem {
  lessonId: string;
  courseId: string;
  courseTitle: string;
  lessonTitle: string;
  thumbnailUrl: string | null;
  savedTime: number;
  progressPercent: number;
}

/** Save the real duration (in seconds) of a lesson so progress % is accurate. */
export const saveLessonDuration = (lessonId: string, duration: number) => {
  if (!lessonId || !duration) return;
  try {
    localStorage.setItem(`${DURATION_PREFIX}${lessonId}`, String(duration));
  } catch { /* ignore */ }
};

/** Read saved progress % for a lesson directly from localStorage. */
export const getProgressPercent = (lessonId: string): number => {
  try {
    const timeStr = localStorage.getItem(`${STORAGE_PREFIX}${lessonId}`);
    const durStr = localStorage.getItem(`${DURATION_PREFIX}${lessonId}`);
    if (!timeStr || !durStr) return 0;
    const time = parseFloat(timeStr);
    const duration = parseFloat(durStr);
    if (!duration || !time || isNaN(time) || isNaN(duration)) return 0;
    return Math.min(99, Math.round((time / duration) * 100));
  } catch { return 0; }
};

export const useContinueWatching = () => {
  const [items, setItems] = useState<ContinueWatchingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Collect all lesson IDs with saved progress (only unfinished ones)
      const lessonIds: { id: string; time: number }[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(STORAGE_PREFIX)) {
          const lessonId = key.replace(STORAGE_PREFIX, "");
          const saved = localStorage.getItem(key);
          if (saved) {
            const time = parseFloat(saved);
            // time > 1 means started; useVideoProgress already removes key when finished (near end)
            if (!isNaN(time) && time > 1) {
              lessonIds.push({ id: lessonId, time });
            }
          }
        }
      }

      if (lessonIds.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      // Fetch lessons + modules + courses for these IDs
      const ids = lessonIds.map((l) => l.id);
      const { data: lessons } = await supabase
        .from("course_lessons")
        .select("id, title, thumbnail_url, duration, module_id")
        .in("id", ids);

      if (!lessons?.length) {
        setItems([]);
        setLoading(false);
        return;
      }

      const moduleIds = [...new Set(lessons.map((l) => l.module_id))];
      const { data: modules } = await supabase
        .from("course_modules")
        .select("id, course_id")
        .in("id", moduleIds);

      if (!modules?.length) {
        setItems([]);
        setLoading(false);
        return;
      }

      const courseIds = [...new Set(modules.map((m) => m.course_id))];
      const { data: courses } = await supabase
        .from("courses")
        .select("id, title, thumbnail_url, hero_image_url")
        .in("id", courseIds);

      if (!courses?.length) {
        setItems([]);
        setLoading(false);
        return;
      }

      // Build map for quick lookup
      const moduleMap = new Map(modules.map((m) => [m.id, m.course_id]));
      const courseMap = new Map(courses.map((c) => [c.id, c]));

      const result: ContinueWatchingItem[] = lessons
        .map((lesson) => {
          const courseId = moduleMap.get(lesson.module_id);
          if (!courseId) return null;
          const course = courseMap.get(courseId);
          if (!course) return null;
          const savedEntry = lessonIds.find((l) => l.id === lesson.id);
          if (!savedEntry) return null;

          // Prefer real duration from localStorage; fallback to DB duration string
          const progressPercent = getProgressPercent(lesson.id) || (() => {
            if (!lesson.duration) return 0;
            const parts = lesson.duration.split(":").map(Number);
            let totalSeconds = 0;
            if (parts.length === 2) totalSeconds = parts[0] * 60 + parts[1];
            else if (parts.length === 3) totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
            if (!totalSeconds) return 0;
            return Math.min(99, Math.round((savedEntry.time / totalSeconds) * 100));
          })();

          return {
            lessonId: lesson.id,
            courseId: course.id,
            courseTitle: course.title,
            lessonTitle: lesson.title,
            thumbnailUrl: course.thumbnail_url,
            savedTime: savedEntry.time,
            progressPercent,
          } as ContinueWatchingItem;
        })
        .filter(Boolean) as ContinueWatchingItem[];

      setItems(result);
    } catch (e) {
      console.error("useContinueWatching error:", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Reload whenever the page becomes visible again (user returns from lesson)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        load();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [load]);

  return { items, loading, reload: load };
};

