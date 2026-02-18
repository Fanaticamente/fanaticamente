import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_PREFIX = "fanatica_video_progress_";

export interface ContinueWatchingItem {
  lessonId: string;
  courseId: string;
  courseTitle: string;
  lessonTitle: string;
  thumbnailUrl: string | null;
  savedTime: number;
  progressPercent: number;
}

export const useContinueWatching = () => {
  const [items, setItems] = useState<ContinueWatchingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Collect all lesson IDs with saved progress
        const lessonIds: { id: string; time: number }[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith(STORAGE_PREFIX)) {
            const lessonId = key.replace(STORAGE_PREFIX, "");
            const saved = localStorage.getItem(key);
            if (saved) {
              const time = parseFloat(saved);
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

            // Calculate progress percent from duration string (e.g. "12:30")
            let progressPercent = 0;
            if (lesson.duration) {
              const parts = lesson.duration.split(":").map(Number);
              let totalSeconds = 0;
              if (parts.length === 2) totalSeconds = parts[0] * 60 + parts[1];
              else if (parts.length === 3) totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
              if (totalSeconds > 0) {
                progressPercent = Math.min(100, Math.round((savedEntry.time / totalSeconds) * 100));
              }
            }

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
    };

    load();
  }, []);

  return { items, loading };
};
