import {
  Home, Users, BookOpen, GraduationCap, Radio, Newspaper, User, Settings,
  Heart, Star, Calendar, CalendarDays, MessageCircle, Play, Music, Video,
  Image, FileText, Search, Bell, Mail, Phone, MapPin, Clock, Briefcase,
  Trophy, Tv, LayoutDashboard, Brain, ShoppingBag, type LucideIcon,
} from "lucide-react";
import { CommunityIcon } from "@/components/icons/CommunityIcon";

export const MENU_ICONS: Record<string, LucideIcon | typeof CommunityIcon> = {
  Home, Users, BookOpen, GraduationCap, Radio, Newspaper, User, Settings,
  Heart, Star, Calendar, CalendarDays, MessageCircle, Play, Music, Video,
  Image, FileText, Search, Bell, Mail, Phone, MapPin, Clock, Briefcase,
  Trophy, Tv, LayoutDashboard, Brain, ShoppingBag,
  Community: CommunityIcon,
};

export const MENU_ICON_NAMES = Object.keys(MENU_ICONS);

export const getMenuIcon = (name?: string) =>
  (name && MENU_ICONS[name]) || Home;
