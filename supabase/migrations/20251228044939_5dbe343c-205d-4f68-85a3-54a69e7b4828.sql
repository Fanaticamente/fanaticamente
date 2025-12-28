-- Enable realtime for app_content table
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_content;

-- Enable realtime for app_menus table  
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_menus;