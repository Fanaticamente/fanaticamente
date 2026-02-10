
-- Storage bucket for course videos and thumbnails
INSERT INTO storage.buckets (id, name, public) VALUES ('course-assets', 'course-assets', true);

-- Storage policies for course assets
CREATE POLICY "Anyone can view course assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-assets');

CREATE POLICY "Admins and developers can upload course assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-assets' AND (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'developer'::app_role)
  )
);

CREATE POLICY "Admins and developers can update course assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'course-assets' AND (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'developer'::app_role)
  )
);

CREATE POLICY "Admins and developers can delete course assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'course-assets' AND (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'developer'::app_role)
  )
);

-- Courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  category TEXT NOT NULL DEFAULT 'Geral',
  instructor TEXT,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  price NUMERIC(10,2) DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  total_duration TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published courses"
ON public.courses FOR SELECT
USING (is_published = true);

CREATE POLICY "Admins/devs can view all courses"
ON public.courses FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'developer'::app_role)
);

CREATE POLICY "Admins/devs can insert courses"
ON public.courses FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'developer'::app_role)
);

CREATE POLICY "Admins/devs can update courses"
ON public.courses FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'developer'::app_role)
);

CREATE POLICY "Admins/devs can delete courses"
ON public.courses FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'developer'::app_role)
);

-- Course modules
CREATE TABLE public.course_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view modules of published courses"
ON public.course_modules FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND is_published = true)
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'developer'::app_role)
);

CREATE POLICY "Admins/devs can insert modules"
ON public.course_modules FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'developer'::app_role)
);

CREATE POLICY "Admins/devs can update modules"
ON public.course_modules FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'developer'::app_role)
);

CREATE POLICY "Admins/devs can delete modules"
ON public.course_modules FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'developer'::app_role)
);

-- Course lessons
CREATE TABLE public.course_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  duration TEXT,
  is_free BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view lessons of published courses"
ON public.course_lessons FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.course_modules cm
    JOIN public.courses c ON c.id = cm.course_id
    WHERE cm.id = module_id AND c.is_published = true
  )
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'developer'::app_role)
);

CREATE POLICY "Admins/devs can insert lessons"
ON public.course_lessons FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'developer'::app_role)
);

CREATE POLICY "Admins/devs can update lessons"
ON public.course_lessons FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'developer'::app_role)
);

CREATE POLICY "Admins/devs can delete lessons"
ON public.course_lessons FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'developer'::app_role)
);

-- Lesson activities
CREATE TABLE public.lesson_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  activity_type TEXT NOT NULL DEFAULT 'text',
  content JSONB DEFAULT '{}',
  is_required BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lesson_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view activities of published courses"
ON public.lesson_activities FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.course_lessons cl
    JOIN public.course_modules cm ON cm.id = cl.module_id
    JOIN public.courses c ON c.id = cm.course_id
    WHERE cl.id = lesson_id AND c.is_published = true
  )
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'developer'::app_role)
);

CREATE POLICY "Admins/devs can insert activities"
ON public.lesson_activities FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'developer'::app_role)
);

CREATE POLICY "Admins/devs can update activities"
ON public.lesson_activities FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'developer'::app_role)
);

CREATE POLICY "Admins/devs can delete activities"
ON public.lesson_activities FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'developer'::app_role)
);

-- User course access
CREATE TABLE public.user_course_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  access_type TEXT NOT NULL DEFAULT 'purchase',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

ALTER TABLE public.user_course_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own access"
ON public.user_course_access FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins/devs can manage access"
ON public.user_course_access FOR ALL
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'developer'::app_role)
);

-- User lesson progress
CREATE TABLE public.user_lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  progress_percent INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  last_position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
ON public.user_lesson_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
ON public.user_lesson_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
ON public.user_lesson_progress FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins/devs can manage progress"
ON public.user_lesson_progress FOR ALL
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'developer'::app_role)
);

-- User activity completion
CREATE TABLE public.user_activity_completion (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_id UUID NOT NULL REFERENCES public.lesson_activities(id) ON DELETE CASCADE,
  response JSONB DEFAULT '{}',
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, activity_id)
);

ALTER TABLE public.user_activity_completion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own completions"
ON public.user_activity_completion FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completions"
ON public.user_activity_completion FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins/devs can manage completions"
ON public.user_activity_completion FOR ALL
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'developer'::app_role)
);

-- Updated_at triggers
CREATE TRIGGER update_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_modules_updated_at
BEFORE UPDATE ON public.course_modules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_lessons_updated_at
BEFORE UPDATE ON public.course_lessons
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lesson_activities_updated_at
BEFORE UPDATE ON public.lesson_activities
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_lesson_progress_updated_at
BEFORE UPDATE ON public.user_lesson_progress
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
