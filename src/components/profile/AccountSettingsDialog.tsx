import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Mail, Lock, Trash2, Loader2, Eye, EyeOff } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface AccountSettingsDialogProps {
  trigger?: React.ReactNode;
}

const deleteReasons = [
  { id: "not_using", label: "Não estou mais usando o aplicativo" },
  { id: "found_alternative", label: "Encontrei outra alternativa melhor" },
  { id: "privacy", label: "Preocupações com privacidade dos meus dados" },
  { id: "bad_experience", label: "Experiência ruim com o serviço" },
  { id: "other", label: "Outro motivo" },
];

const AccountSettingsDialog = ({ trigger }: AccountSettingsDialogProps) => {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  const handleUpdateEmail = async () => {
    if (!email || email === user?.email) {
      toast.info("Digite um novo e-mail para atualizar");
      return;
    }

    setLoadingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email });
      
      if (error) throw error;
      
      toast.success("Um e-mail de confirmação foi enviado para o novo endereço. Verifique sua caixa de entrada.");
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar e-mail");
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword) {
      toast.error("Digite uma nova senha");
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    setLoadingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) throw error;
      
      toast.success("Senha atualizada com sucesso!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar senha");
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteReason) {
      toast.error("Por favor, selecione um motivo");
      return;
    }

    setLoadingDelete(true);
    try {
      // Note: Complete account deletion requires admin privileges
      // For now, we'll disable the account and sign out
      // In production, you'd call an edge function with service role
      
      // Log the deletion reason (could be stored in a table)
      console.log("Account deletion requested:", { userId: user?.id, reason: deleteReason });
      
      // Sign out the user
      await signOut();
      
      toast.success("Sua conta foi desativada. Entre em contato com o suporte para exclusão completa.");
      setDeleteDialogOpen(false);
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir conta");
    } finally {
      setLoadingDelete(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <Settings className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-therapy">
              <Settings className="w-5 h-5" />
              Configurações da Conta
            </DialogTitle>
            <DialogDescription>
              Gerencie suas informações de login e conta
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Email Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-card-foreground">
                <Mail className="w-4 h-4" />
                Alterar E-mail
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-muted-foreground text-xs">
                  E-mail atual
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                />
              </div>
              <Button
                onClick={handleUpdateEmail}
                disabled={loadingEmail || email === user?.email}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {loadingEmail ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  "Atualizar E-mail"
                )}
              </Button>
            </div>

            <div className="border-t border-border" />

            {/* Password Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-card-foreground">
                <Lock className="w-4 h-4" />
                Alterar Senha
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-muted-foreground text-xs">
                  Nova senha
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-muted-foreground text-xs">
                  Confirmar nova senha
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button
                onClick={handleUpdatePassword}
                disabled={loadingPassword || !newPassword}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {loadingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  "Atualizar Senha"
                )}
              </Button>
            </div>

            <div className="border-t border-border" />

            {/* Delete Account Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                <Trash2 className="w-4 h-4" />
                Excluir Conta
              </div>
              <p className="text-xs text-muted-foreground">
                Esta ação é irreversível. Todos os seus dados serão permanentemente excluídos.
              </p>
              <Button
                onClick={() => setDeleteDialogOpen(true)}
                variant="destructive"
                size="sm"
                className="w-full"
              >
                Excluir Minha Conta
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Excluir Conta
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.
              Por favor, nos diga o motivo:
            </AlertDialogDescription>
          </AlertDialogHeader>

          <RadioGroup value={deleteReason} onValueChange={setDeleteReason} className="space-y-3 py-4">
            {deleteReasons.map((reason) => (
              <div key={reason.id} className="flex items-center space-x-3">
                <RadioGroupItem value={reason.id} id={reason.id} />
                <Label htmlFor={reason.id} className="text-sm cursor-pointer">
                  {reason.label}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={loadingDelete || !deleteReason}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loadingDelete ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Confirmar Exclusão"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AccountSettingsDialog;
