import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import UserDesktopLayout from "@/components/layout/UserDesktopLayout";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Bell, 
  Lock, 
  Shield, 
  Trash2, 
  ChevronRight,
  Moon,
  Globe,
  HelpCircle,
  FileText,
  LogOut,
  User,
  Mail
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import AccountSettingsDialog from "@/components/profile/AccountSettingsDialog";
import { getDisplayAuthEmail } from "@/lib/appMode";

const Configuracoes = () => {
  const isMobile = useIsMobile();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const displayEmail = getDisplayAuthEmail(user);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    toast.success("Você saiu da sua conta");
  };

  const ConfiguracoesContent = () => (
    <div className="space-y-6">
      {/* Account Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Conta
          </CardTitle>
          <CardDescription>
            Gerencie suas informações de conta e segurança
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-border rounded-xl hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setShowAccountDialog(true)}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <Mail className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">Email</p>
                <p className="text-sm text-muted-foreground">{displayEmail}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>

          <div className="flex items-center justify-between p-4 border border-border rounded-xl hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setShowAccountDialog(true)}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <Lock className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">Alterar Senha</p>
                <p className="text-sm text-muted-foreground">Atualize sua senha de acesso</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      {/* Notifications Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notificações
          </CardTitle>
          <CardDescription>
            Configure como você quer ser notificado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-notifications" className="text-base">Notificações Push</Label>
              <p className="text-sm text-muted-foreground">
                Receba alertas sobre agendamentos e lembretes
              </p>
            </div>
            <Switch
              id="push-notifications"
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications" className="text-base">Notificações por Email</Label>
              <p className="text-sm text-muted-foreground">
                Receba confirmações e novidades por email
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
        </CardContent>
      </Card>

      {/* Appearance Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="w-5 h-5" />
            Aparência
          </CardTitle>
          <CardDescription>
            Personalize a aparência do aplicativo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="dark-mode" className="text-base">Modo Escuro</Label>
              <p className="text-sm text-muted-foreground">
                Ative o tema escuro para reduzir o cansaço visual
              </p>
            </div>
            <Switch
              id="dark-mode"
              checked={darkMode}
              onCheckedChange={(checked) => {
                setDarkMode(checked);
                toast.info("Modo escuro em breve!");
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Legal Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Legal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div 
            className="flex items-center justify-between p-4 border border-border rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => navigate("/politica-privacidade")}
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium text-foreground">Política de Privacidade</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
          <div 
            className="flex items-center justify-between p-4 border border-border rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => toast.info("Termos de uso em breve!")}
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium text-foreground">Termos de Uso</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      {/* Support Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Suporte
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="flex items-center justify-between p-4 border border-border rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => toast.info("Central de ajuda em breve!")}
          >
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium text-foreground">Central de Ajuda</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            Zona de Perigo
          </CardTitle>
          <CardDescription>
            Ações irreversíveis para sua conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            variant="outline" 
            className="w-full justify-start gap-3 text-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5" />
            Sair da Conta
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-3 text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="w-5 h-5" />
                Excluir Conta
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação é irreversível. Todos os seus dados, incluindo agendamentos e histórico, serão permanentemente excluídos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => toast.error("Para excluir sua conta, entre em contato com o suporte.")}
                >
                  Excluir Conta
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {showAccountDialog && (
        <AccountSettingsDialog 
          trigger={<span style={{ display: 'none' }} />}
        />
      )}
    </div>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header title="Configurações" />
        <main className="container py-4 pt-20">
          <h1 className="text-xl font-bold mb-4">Configurações</h1>
          <ConfiguracoesContent />
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <UserDesktopLayout title="Configurações" subtitle="Gerencie suas preferências e configurações de conta">
      <ConfiguracoesContent />
    </UserDesktopLayout>
  );
};

export default Configuracoes;
