import { useState } from "react";
import { X, User, Mail, Phone, Calendar, MapPin, Trash2, Heart } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO, differenceInYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ThemeStyles {
  bg: string;
  card: string;
  text: string;
  textMuted: string;
  border: string;
  hoverBg: string;
  tableBg: string;
}

interface UserData {
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

interface UserDetailsDialogProps {
  user: UserData | null;
  open: boolean;
  onClose: () => void;
  themeStyles: ThemeStyles;
  onRefresh: () => void;
}

const ADMIN_PASSWORD = "fanatica2025";

const UserDetailsDialog = ({
  user,
  open,
  onClose,
  themeStyles,
  onRefresh,
}: UserDetailsDialogProps) => {
  const [activeTab, setActiveTab] = useState<"info" | "delete">("info");
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  if (!user) return null;

  const age = user.birth_date
    ? differenceInYears(new Date(), parseISO(user.birth_date))
    : null;

  const handleDelete = async () => {
    if (deletePassword !== ADMIN_PASSWORD) {
      toast.error("Senha de segurança incorreta");
      return;
    }

    setIsDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-user-completely", {
        body: {
          userId: user.user_id,
          adminPassword: deletePassword,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Conta excluída completamente do sistema!");
      onRefresh();
      onClose();
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Erro ao excluir conta");
    } finally {
      setIsDeleting(false);
      setDeletePassword("");
    }
  };

  const getRoleBadge = (roles: string[]) => {
    if (roles.includes("admin")) {
      return { label: "Admin", className: "bg-red-500/20 text-red-500" };
    }
    if (roles.includes("developer")) {
      return { label: "Developer", className: "bg-purple-500/20 text-purple-500" };
    }
    return { label: "Torcedor", className: "bg-primary/20 text-primary" };
  };

  const roleBadge = getRoleBadge(user.roles);

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white text-gray-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-emerald-100 flex items-center justify-center">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt=""
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <User className="w-8 h-8 text-emerald-600" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="text-xl font-semibold text-gray-900">
                  {user.full_name || "Sem nome"}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm ${roleBadge.className}`}>
                  {roleBadge.label}
                </span>
              </div>
              <span className="text-base text-gray-500">
                Cadastrado em {format(parseISO(user.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-3 border-b border-gray-200 pb-3 mb-6 mt-4">
          <button
            onClick={() => setActiveTab("info")}
            className={`px-5 py-2.5 rounded-lg text-base font-medium transition-colors ${
              activeTab === "info" ? "bg-emerald-500 text-white" : "hover:bg-gray-100 text-gray-700"
            }`}
          >
            Informações
          </button>
          {!user.roles.includes("admin") && !user.roles.includes("developer") && (
            <button
              onClick={() => setActiveTab("delete")}
              className={`px-5 py-2.5 rounded-lg text-base font-medium transition-colors flex items-center gap-2 ${
                activeTab === "delete" ? "bg-red-500 text-white" : "hover:bg-red-50 text-red-600"
              }`}
            >
              <Trash2 className="w-4 h-4" />
              Excluir
            </button>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === "info" && (
          <div className="space-y-6">
            {/* Personal Info */}
            <div className="grid grid-cols-2 gap-5">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-emerald-600" />
                <div>
                  <span className="text-sm text-gray-500">E-mail</span>
                  <p className="text-base text-gray-800">{user.email || "Não informado"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-emerald-600" />
                <div>
                  <span className="text-sm text-gray-500">Telefone</span>
                  <p className="text-base text-gray-800">{user.phone || "Não informado"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <div>
                  <span className="text-sm text-gray-500">Idade</span>
                  <p className="text-base text-gray-800">
                    {age ? `${age} anos` : "Não informado"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <div>
                  <span className="text-sm text-gray-500">Localização</span>
                  <p className="text-base text-gray-800">
                    {user.city && user.state 
                      ? `${user.city}, ${user.state}`
                      : user.city || user.state || "Não informado"}
                  </p>
                </div>
              </div>
            </div>

            {/* Favorite Club */}
            {user.club && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Heart className="w-5 h-5 text-red-500" />
                  <span className="text-base font-medium text-gray-800">Clube do Coração</span>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  {user.club.badge_url && (
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center p-1 shadow-sm">
                      <img
                        src={user.club.badge_url}
                        alt={user.club.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <span className="text-lg font-medium text-gray-800">{user.club.name}</span>
                </div>
              </div>
            )}

            {/* Birth Date */}
            {user.birth_date && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-500">Data de Nascimento</span>
                <p className="text-base font-medium text-gray-800">
                  {format(parseISO(user.birth_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "delete" && (
          <div className="space-y-6">
            <div className="p-5 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="text-lg font-semibold text-red-600 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Excluir Conta Permanentemente
              </h4>
              <p className="text-base text-red-600/80 mt-2">
                Esta ação é irreversível. Todos os dados do usuário serão permanentemente removidos do sistema.
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="deletePassword" className="text-base text-gray-700">
                Senha de Segurança
              </Label>
              <Input
                id="deletePassword"
                name="admin_delete_password"
                autoComplete="new-password"
                autoCorrect="off"
                spellCheck={false}
                type="password"
                placeholder="Digite a senha de segurança para confirmar"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="bg-white border-gray-300"
              />
            </div>

            <button
              onClick={handleDelete}
              disabled={isDeleting || !deletePassword}
              className="w-full py-3 bg-red-500 text-white rounded-lg text-base font-medium flex items-center justify-center gap-2 hover:bg-red-600 disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5" />
                  Excluir Permanentemente
                </>
              )}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailsDialog;
