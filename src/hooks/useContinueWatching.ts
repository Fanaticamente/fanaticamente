import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { STORAGE_PREFIX, DURATION_PREFIX_KEY } from "./useVideoProgress";

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
    const uid = getUserIdFromStorage();
    const key = uid
      ? `${DURATION_PREFIX_KEY}${uid}_${lessonId}`
      : `${DURATION_PREFIX_KEY}${lessonId}`;
    localStorage.setItem(key, String(duration));
  } catch { /* ignore */ }
};

/** Read user id synchronously from localStorage without any async call. */
const getUserIdFromStorage = (): string | null => {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith("sb-") && k.endsWith("-auth-token")) {
        const val = localStorage.getItem(k);
        if (val) {
          const parsed = JSON.parse(val);
          return parsed?.user?.id ?? null;
        }
      }
    }
  } catch { /* ignore */ }
  return null;
};

interface RawProgress {
  lessonId: string;
  time: number;
  progressPercent: number;
}

/** Reads all in-progress lessons synchronously from localStorage. Returns instantly — zero async. */
const readProgressSync = (): RawProgress[] => {
  const userId = getUserIdFromStorage();
  const results: RawProgress[] = [];

  try {
    const userPrefix = userId ? `${STORAGE_PREFIX}${userId}_` : null;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      let lessonId: string | null = null;
      if (userPrefix && key.startsWith(userPrefix)) {
        lessonId = key.slice(userPrefix.length);
      } else if (!userId && key.startsWith(STORAGE_PREFIX)) {
        lessonId = key.slice(STORAGE_PREFIX.length);
      }

      if (!lessonId) continue;

      const time = parseFloat(localStorage.getItem(key) ?? "");
      if (isNaN(time) || time <= 1) continue;

      // Read duration for progress %
      const durKey = userId
        ? `${DURATION_PREFIX_KEY}${userId}_${lessonId}`
        : `${DURATION_PREFIX_KEY}${lessonId}`;
      const duration = parseFloat(localStorage.getItem(durKey) ?? "");

      if (isNaN(duration) || duration <= 0) continue;
      // Skip finished lessons (< 5s remaining)
      if (duration - time < 5) continue;

      const progressPercent = Math.min(99, Math.round((time / duration) * 100));
      results.push({ lessonId, time, progressPercent });
    }
  } catch { /* ignore */ }

  return results;
};

// Cache of lesson metadata so we don't re-fetch on every reload
const metaCache = new Map<string, Pick<ContinueWatchingItem, "courseId" | "courseTitle" | "lessonTitle" | "thumbnailUrl">>();

const fetchMeta = async (lessonIds: string[]) => {
  const missing = lessonIds.filter((id) => !metaCache.has(id));
  if (missing.length === 0) return;

  const { data: lessons } = await supabase
    .from("course_lessons")
    .select("id, title, thumbnail_url, module_id")
    .in("id", missing);

  if (!lessons?.length) return;

  const moduleIds = [...new Set(lessons.map((l) => l.module_id))];
  const { data: modules } = await supabase
    .from("course_modules")
    .select("id, course_id")
    .in("id", moduleIds);

  if (!modules?.length) return;

  const courseIds = [...new Set(modules.map((m) => m.course_id))];
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, thumbnail_url, hero_image_url")
    .in("id", courseIds);

  if (!courses?.length) return;

  const moduleMap = new Map(modules.map((m) => [m.id, m.course_id]));
  const courseMap = new Map(courses.map((c) => [c.id, c]));

  for (const lesson of lessons) {
    const courseId = moduleMap.get(lesson.module_id);
    if (!courseId) continue;
    const course = courseMap.get(courseId);
    if (!course) continue;
    metaCache.set(lesson.id, {
      courseId: course.id,
      courseTitle: course.title,
      lessonTitle: lesson.title,
      thumbnailUrl: lesson.thumbnail_url ?? course.hero_image_url ?? course.thumbnail_url ?? null,
    });
  }
};

/** Build the full item list from raw progress + meta cache. */
const buildItems = (raw: RawProgress[]): ContinueWatchingItem[] =>
  raw
    .map(({ lessonId, time, progressPercent }) => {
      const meta = metaCache.get(lessonId);
      if (!meta) return null;
      return { lessonId, savedTime: time, progressPercent, ...meta } as ContinueWatchingItem;
    })
    .filter(Boolean) as ContinueWatchingItem[];

export const useContinueWatching = () => {
  // Initialize state synchronously — items appear on first render if meta is cached
  const [items, setItems] = useState<ContinueWatchingItem[]>(() => buildItems(readProgressSync()));
  const loadingRef = useRef(false);

  const load = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    const raw = readProgressSync();

    if (raw.length === 0) {
      setItems([]);
      loadingRef.current = false;
      return;
    }

    // Show immediately from cache (may be partial if meta not cached yet)
    const immediate = buildItems(raw);
    if (immediate.length > 0) setItems(immediate);

    // Fetch missing meta from DB, then update
    await fetchMeta(raw.map((r) => r.lessonId));
    setItems(buildItems(raw));

    loadingRef.current = false;
  }, []);

  // Fire synchronously on mount
  useEffect(() => {
    load();
  }, [load]);

  // Refresh when tab becomes visible again (returning from lesson)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [load]);

  return { items, loading: false, reload: load };
};
