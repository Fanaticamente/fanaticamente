import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import UserDetailsDialog from "./UserDetailsDialog";

interface ThemeStyles {
  bg: string;
  card: string;
  text: string;
  textMuted: string;
  border: string;
  inputBg: string;
  hoverBg: string;
  tableBg: string;
}

interface AdminUsersTableProps {
  themeStyles: ThemeStyles;
  searchTerm: string;
}

interface User {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  favorite_club_id: string | null;
  city: string | null;
  state: string | null;
  birth_date: string | null;
  avatar_url: string | null;
  created_at: string;
  email?: string;
  roles: string[];
  club?: {
    id: string;
    name: string;
    primary_color: string;
    badge_url: string | null;
  };
}

const AdminUsersTable = ({ themeStyles, searchTerm }: AdminUsersTableProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Fetch clubs for favorite_club_id
      const clubIds = [...new Set((profiles || []).map(p => p.favorite_club_id).filter(Boolean))];
      let clubsMap = new Map<string, { id: string; name: string; primary_color: string; badge_url: string | null }>();
      
      if (clubIds.length > 0) {
        const { data: clubs } = await supabase
          .from("clubs")
          .select("id, name, primary_color, badge_url")
          .in("id", clubIds);
        
        (clubs || []).forEach(club => {
          clubsMap.set(club.id, club);
        });
      }

      // Map roles to users
      const rolesMap = new Map<string, string[]>();
      (roles || []).forEach(r => {
        const existing = rolesMap.get(r.user_id) || [];
        rolesMap.set(r.user_id, [...existing, r.role]);
      });

      const usersWithRoles = (profiles || []).map(profile => ({
        ...profile,
        club: profile.favorite_club_id ? clubsMap.get(profile.favorite_club_id) : undefined,
        roles: rolesMap.get(profile.user_id) || ["user"]
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    setDetailsDialogOpen(true);
  };

  // Filter out professionals - they have their own page
  const filteredUsers = users.filter(user => {
    // Exclude professionals
    if (user.roles.includes("professional")) return false;
    
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(search) ||
      user.city?.toLowerCase().includes(search) ||
      user.state?.toLowerCase().includes(search) ||
      user.phone?.includes(search)
    );
  });

  const getRoleBadge = (roles: string[]) => {
    if (roles.includes("admin")) {
      return { label: "Admin", className: "bg-red-500/20 text-red-500" };
    }
    if (roles.includes("developer")) {
      return { label: "Developer", className: "bg-purple-500/20 text-purple-500" };
    }
    return { label: "Torcedor", className: "bg-primary/20 text-primary" };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className={`${themeStyles.card} border ${themeStyles.border} rounded-xl overflow-hidden`}>
        <div className={`p-4 border-b ${themeStyles.border} flex items-center justify-between`}>
          <h2 className={`font-display text-xl ${themeStyles.text}`}>
            Usuários ({filteredUsers.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={themeStyles.tableBg}>
              <tr>
                <th className={`text-left p-4 ${themeStyles.textMuted} font-medium`}>Nome</th>
                <th className={`text-left p-4 ${themeStyles.textMuted} font-medium`}>Telefone</th>
                <th className={`text-left p-4 ${themeStyles.textMuted} font-medium`}>Tipo</th>
                <th className={`text-left p-4 ${themeStyles.textMuted} font-medium`}>Localização</th>
                <th className={`text-left p-4 ${themeStyles.textMuted} font-medium`}>Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const roleBadge = getRoleBadge(user.roles);
                  return (
                    <tr 
                      key={user.id} 
                      className={`border-b ${themeStyles.border} ${themeStyles.hoverBg} cursor-pointer transition-colors`}
                      onClick={() => handleUserClick(user)}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-sm">
                                {user.full_name?.charAt(0).toUpperCase() || "?"}
                              </span>
                            )}
                          </div>
                          <span className={themeStyles.text}>{user.full_name || "Sem nome"}</span>
                        </div>
                      </td>
                      <td className={`p-4 ${themeStyles.textMuted}`}>{user.phone || "-"}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${roleBadge.className}`}>
                          {roleBadge.label}
                        </span>
                      </td>
                      <td className={`p-4 ${themeStyles.text}`}>
                        {user.city && user.state ? `${user.city}, ${user.state}` : "-"}
                      </td>
                      <td className={`p-4 ${themeStyles.textMuted}`}>
                        {new Date(user.created_at).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className={`p-8 text-center ${themeStyles.textMuted}`}>
                    {searchTerm ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Dialog */}
      <UserDetailsDialog
        user={selectedUser}
        open={detailsDialogOpen}
        onClose={() => {
          setDetailsDialogOpen(false);
          setSelectedUser(null);
        }}
        themeStyles={themeStyles}
        onRefresh={fetchUsers}
      />
    </>
  );
};

export default AdminUsersTable;
