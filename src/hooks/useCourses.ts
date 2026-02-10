import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  category: string;
  instructor: string | null;
  is_premium: boolean;
  price: number | null;
  is_published: boolean;
  order_index: number;
  total_duration: string | null;
  created_at: string;
  updated_at: string;
}

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface CourseLesson {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  duration: string | null;
  is_free: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface LessonActivity {
  id: string;
  lesson_id: string;
  title: string;
  description: string | null;
  activity_type: string;
  content: Record<string, unknown>;
  is_required: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

// Fetch all published courses
export const useCourses = () => {
  return useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("order_index");
      if (error) throw error;
      return data as unknown as Course[];
    },
  });
};

// Fetch all courses (for admin)
export const useAllCourses = () => {
  return useQuery({
    queryKey: ["courses-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("order_index");
      if (error) throw error;
      return data as unknown as Course[];
    },
  });
};

// Fetch single course
export const useCourse = (courseId: string | undefined) => {
  return useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId!)
        .single();
      if (error) throw error;
      return data as unknown as Course;
    },
    enabled: !!courseId,
  });
};

// Fetch modules for a course
export const useCourseModules = (courseId: string | undefined) => {
  return useQuery({
    queryKey: ["course-modules", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_modules")
        .select("*")
        .eq("course_id", courseId!)
        .order("order_index");
      if (error) throw error;
      return data as unknown as CourseModule[];
    },
    enabled: !!courseId,
  });
};

// Fetch lessons for a module
export const useModuleLessons = (moduleId: string | undefined) => {
  return useQuery({
    queryKey: ["module-lessons", moduleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_lessons")
        .select("*")
        .eq("module_id", moduleId!)
        .order("order_index");
      if (error) throw error;
      return data as unknown as CourseLesson[];
    },
    enabled: !!moduleId,
  });
};

// Fetch all lessons for a course (across all modules)
export const useCourseLessons = (courseId: string | undefined) => {
  return useQuery({
    queryKey: ["course-lessons", courseId],
    queryFn: async () => {
      const { data: modules, error: mErr } = await supabase
        .from("course_modules")
        .select("id")
        .eq("course_id", courseId!);
      if (mErr) throw mErr;
      if (!modules?.length) return [];
      const moduleIds = modules.map((m: { id: string }) => m.id);
      const { data, error } = await supabase
        .from("course_lessons")
        .select("*")
        .in("module_id", moduleIds)
        .order("order_index");
      if (error) throw error;
      return data as unknown as CourseLesson[];
    },
    enabled: !!courseId,
  });
};

// Fetch activities for a lesson
export const useLessonActivities = (lessonId: string | undefined) => {
  return useQuery({
    queryKey: ["lesson-activities", lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lesson_activities")
        .select("*")
        .eq("lesson_id", lessonId!)
        .order("order_index");
      if (error) throw error;
      return data as unknown as LessonActivity[];
    },
    enabled: !!lessonId,
  });
};

// MUTATIONS

export const useCreateCourse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (course: Partial<Course>) => {
      const { data, error } = await supabase
        .from("courses")
        .insert(course as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["courses"] });
      qc.invalidateQueries({ queryKey: ["courses-all"] });
      toast.success("Curso criado!");
    },
    onError: () => toast.error("Erro ao criar curso"),
  });
};

export const useUpdateCourse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Course> & { id: string }) => {
      const { error } = await supabase
        .from("courses")
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["courses"] });
      qc.invalidateQueries({ queryKey: ["courses-all"] });
      toast.success("Curso atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar curso"),
  });
};

export const useDeleteCourse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("courses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["courses"] });
      qc.invalidateQueries({ queryKey: ["courses-all"] });
      toast.success("Curso removido!");
    },
    onError: () => toast.error("Erro ao remover curso"),
  });
};

export const useCreateModule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (mod: Partial<CourseModule>) => {
      const { data, error } = await supabase
        .from("course_modules")
        .insert(mod as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["course-modules"] });
      toast.success("Módulo criado!");
    },
    onError: () => toast.error("Erro ao criar módulo"),
  });
};

export const useUpdateModule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CourseModule> & { id: string }) => {
      const { error } = await supabase
        .from("course_modules")
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["course-modules"] });
      toast.success("Módulo atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar módulo"),
  });
};

export const useDeleteModule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("course_modules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["course-modules"] });
      toast.success("Módulo removido!");
    },
    onError: () => toast.error("Erro ao remover módulo"),
  });
};

export const useCreateLesson = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (lesson: Partial<CourseLesson>) => {
      const { data, error } = await supabase
        .from("course_lessons")
        .insert(lesson as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["module-lessons"] });
      qc.invalidateQueries({ queryKey: ["course-lessons"] });
      toast.success("Aula criada!");
    },
    onError: () => toast.error("Erro ao criar aula"),
  });
};

export const useUpdateLesson = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CourseLesson> & { id: string }) => {
      const { error } = await supabase
        .from("course_lessons")
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["module-lessons"] });
      qc.invalidateQueries({ queryKey: ["course-lessons"] });
      toast.success("Aula atualizada!");
    },
    onError: () => toast.error("Erro ao atualizar aula"),
  });
};

export const useDeleteLesson = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("course_lessons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["module-lessons"] });
      qc.invalidateQueries({ queryKey: ["course-lessons"] });
      toast.success("Aula removida!");
    },
    onError: () => toast.error("Erro ao remover aula"),
  });
};

export const useCreateActivity = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (activity: Partial<LessonActivity>) => {
      const { data, error } = await supabase
        .from("lesson_activities")
        .insert(activity as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lesson-activities"] });
      toast.success("Atividade criada!");
    },
    onError: () => toast.error("Erro ao criar atividade"),
  });
};

export const useUpdateActivity = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LessonActivity> & { id: string }) => {
      const { error } = await supabase
        .from("lesson_activities")
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lesson-activities"] });
      toast.success("Atividade atualizada!");
    },
    onError: () => toast.error("Erro ao atualizar atividade"),
  });
};

export const useDeleteActivity = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lesson_activities").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lesson-activities"] });
      toast.success("Atividade removida!");
    },
    onError: () => toast.error("Erro ao remover atividade"),
  });
};
