import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Calendar, 
  BookOpen, 
  Thermometer, 
  Newspaper, 
  ShoppingBag, 
  LogOut,
  LayoutDashboard,
  Briefcase,
  FlaskConical,
  Home as HomeIcon,
  MessageSquare
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getDisplayAuthEmail } from "@/lib/appMode";

const UserDropdownMenu = () => {
  const { user, signOut, hasRole } = useAuth();
  const navigate = useNavigate();
  const isProfessional = hasRole("professional");
  const displayEmail = getDisplayAuthEmail(user);

  // Fetch user profile for avatar and name
  const { data: profile } = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Menu items for regular users (torcedores)
  const userMenuItems = [
    { icon: User, label: "Meu Perfil", path: "/perfil" },
    { icon: Calendar, label: "Meus Agendamentos", path: "/meus-agendamentos" },
    { icon: BookOpen, label: "FanatiClass", path: "/cursos" },
    { icon: Thermometer, label: "Termômetro", path: "/diario" },
    { icon: Newspaper, label: "Notícias", path: "/futebol" },
    { icon: ShoppingBag, label: "FanaticaShop", path: "/loja" },
  ];

  // Menu items for professionals
  const professionalMenuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/profissional" },
    { icon: FlaskConical, label: "FanatiClass Lab", path: "/fanatica-lab" },
    { icon: Briefcase, label: "Psi House", path: "/psi-house" },
    { icon: MessageSquare, label: "Conecta", path: "/conecta" },
    { icon: User, label: "Meu Perfil", path: "/perfil" },
  ];

  const menuItems = isProfessional ? professionalMenuItems : userMenuItems;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 p-1 rounded-full hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-gray-900">
          <Avatar className="h-9 w-9 border-2 border-emerald-500">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-emerald-600 text-white text-sm font-medium">
              {getInitials(profile?.full_name)}
            </AvatarFallback>
          </Avatar>
          <span className="text-white text-sm font-medium hidden xl:block max-w-[120px] truncate">
            {profile?.full_name?.split(" ")[0] || "Usuário"}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-56 bg-black border-neutral-800 text-white z-50"
        sideOffset={8}
      >
        <div className="px-3 py-2 border-b border-gray-700">
          <p className="text-sm font-medium text-white truncate">
            {profile?.full_name || "Usuário"}
          </p>
          <p className="text-xs text-gray-400 truncate">
            {displayEmail}
          </p>
          {isProfessional && (
            <span className="inline-block mt-1 text-xs bg-emerald-600/20 text-emerald-400 px-2 py-0.5 rounded-full">
              Profissional
            </span>
          )}
        </div>

        <div className="py-1">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <DropdownMenuItem key={item.path} asChild>
                <Link 
                  to={item.path} 
                  className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-800 text-gray-200 hover:text-white"
                >
                  <IconComponent className="h-4 w-4 text-gray-400" />
                  <span>{item.label}</span>
                </Link>
              </DropdownMenuItem>
            );
          })}
        </div>

        <DropdownMenuSeparator className="bg-gray-700" />

        <DropdownMenuItem 
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-900/20 focus:bg-red-900/20"
        >
          <LogOut className="h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserDropdownMenu;
