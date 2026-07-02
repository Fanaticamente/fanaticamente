import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
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
import { Settings, Mail, Lock, Trash2, Loader2, Eye, EyeOff, User, Phone, FileText, MapPin, Calendar, Heart } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { brazilianStates, getCitiesByState } from "@/data/brazilianStates";
import { allBrazilianClubs } from "@/data/allBrazilianClubs";
import { encodeAuthEmail, getDisplayAuthEmail } from "@/lib/appMode";

interface AccountSettingsDialogProps {
  trigger?: React.ReactNode;
  isProfessional?: boolean;
}

const deleteReasons = [
  { id: "not_using", label: "Não estou mais usando o aplicativo" },
  { id: "found_alternative", label: "Encontrei outra alternativa melhor" },
  { id: "privacy", label: "Preocupações com privacidade dos meus dados" },
  { id: "bad_experience", label: "Experiência ruim com o serviço" },
  { id: "other", label: "Outro motivo" },
];

const AccountSettingsDialog = ({ trigger, isProfessional = false }: AccountSettingsDialogProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const currentDisplayEmail = getDisplayAuthEmail(user);
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Auth fields
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleteReason, setDeleteReason] = useState("");

  // Profile fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [favoriteClubId, setFavoriteClubId] = useState("");

  // Professional fields
  const [crp, setCrp] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Draft/persistence to avoid losing progress when iOS/PWA kills the process.
  const storageKey = user
    ? `account_settings_dialog_state_${user.id}_${isProfessional ? "pro" : "user"}`
    : null;
  const [draftRestoredForThisOpen, setDraftRestoredForThisOpen] = useState(false);

  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    if (!state) {
      setCities([]);
      return;
    }
    getCitiesByState(state).then(setCities);
  }, [state]);

  const restoreDraft = () => {
    if (!storageKey) return;

    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;

      const parsed = JSON.parse(raw) as Partial<{
        open: boolean;
        data: Partial<{
          fullName: string;
          phone: string;
          birthDate: string;
          state: string;
          city: string;
          favoriteClubId: string;
          crp: string;
          documentType: string;
          documentNumber: string;
          email: string;
        }>;
      }>;

      const d = parsed.data;
      if (!d) return;

      if (typeof d.fullName === "string") setFullName(d.fullName);
      if (typeof d.phone === "string") setPhone(d.phone);
      if (typeof d.birthDate === "string") setBirthDate(d.birthDate);
      if (typeof d.state === "string") setState(d.state);
      if (typeof d.city === "string") setCity(d.city);
      if (typeof d.favoriteClubId === "string") setFavoriteClubId(d.favoriteClubId);

      if (typeof d.crp === "string") setCrp(d.crp);
      if (typeof d.documentType === "string") setDocumentType(d.documentType);
      if (typeof d.documentNumber === "string") setDocumentNumber(d.documentNumber);

      // Email can be updated; keep draft if user was editing it.
      if (typeof d.email === "string") setEmail(d.email);
    } catch {
      // ignore
    }
  };

  // Restore dialog state (open + draft) on mount.
  useEffect(() => {
    if (!storageKey) return;

    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<{ open: boolean }>;
      if (parsed.open) setOpen(true);
    } catch {
      // ignore
    }
  }, [storageKey]);

  useEffect(() => {
    if (currentDisplayEmail) {
      setEmail(currentDisplayEmail);
    }
  }, [currentDisplayEmail]);

  useEffect(() => {
    if (open && user) {
      // First restore any in-progress draft for this overlay, then fetch server data.
      if (!draftRestoredForThisOpen) {
        restoreDraft();
        setDraftRestoredForThisOpen(true);
      }
      loadUserData({ fillOnlyMissing: true });
    }

    if (!open) {
      // Next time it opens, restore draft again.
      setDraftRestoredForThisOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user]);

  // Persist open state + draft continuously.
  useEffect(() => {
    if (!storageKey) return;

    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          open,
          updatedAt: new Date().toISOString(),
          data: {
            fullName,
            phone,
            birthDate,
            state,
            city,
            favoriteClubId,
            crp,
            documentType,
            documentNumber,
            email,
          },
        })
      );
    } catch {
      // ignore
    }
  }, [
    storageKey,
    open,
    fullName,
    phone,
    birthDate,
    state,
    city,
    favoriteClubId,
    crp,
    documentType,
    documentNumber,
    email,
  ]);

  const loadUserData = async (opts?: { fillOnlyMissing?: boolean }) => {
    if (!user) return;

    const fillOnlyMissing = !!opts?.fillOnlyMissing;

    setLoadingProfile(true);
    try {
      // Load profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileData && !profileError) {
        if (!fillOnlyMissing || !fullName) setFullName(profileData.full_name || "");
        if (!fillOnlyMissing || !phone) setPhone(profileData.phone || "");
        if (!fillOnlyMissing || !birthDate) setBirthDate(profileData.birth_date || "");
        if (!fillOnlyMissing || !state) setState(profileData.state || "");
        if (!fillOnlyMissing || !city) setCity(profileData.city || "");
        if (!fillOnlyMissing || !favoriteClubId) setFavoriteClubId(profileData.favorite_club_id || "");
      }

      // If professional, load professional data
      if (isProfessional) {
        const { data: profData, error: profError } = await supabase
          .from('professionals')
          .select('crp, document_type, document_number')
          .eq('user_id', user.id)
          .single();

        if (profData && !profError) {
          if (!fillOnlyMissing || !crp) setCrp(profData.crp || "");
          if (!fillOnlyMissing || !documentType) setDocumentType(profData.document_type || "");
          if (!fillOnlyMissing || !documentNumber) setDocumentNumber(profData.document_number || "");
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setSavingProfile(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone,
          birth_date: birthDate || null,
          state: state,
          city: city,
          favorite_club_id: favoriteClubId || null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
      
      if (profileError) throw profileError;

      // If professional, update professional data
      if (isProfessional) {
        const { error: profError } = await supabase
          .from('professionals')
          .update({
            crp: crp,
            document_type: documentType,
            document_number: documentNumber,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
        
        if (profError) throw profError;
      }

      toast.success("Dados atualizados com sucesso!");

      // Clear draft after a successful save so it doesn't reopen stale data.
      if (storageKey) {
        try {
          localStorage.removeItem(storageKey);
        } catch {
          // ignore
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar dados");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdateEmail = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || normalizedEmail === currentDisplayEmail) {
      toast.info("Digite um novo e-mail para atualizar");
      return;
    }

    setLoadingEmail(true);
    try {
      const accountType = isProfessional ? "pro" : "fan";
      const { error } = await supabase.auth.updateUser({
        email: encodeAuthEmail(normalizedEmail, accountType),
        data: {
          ...(user?.user_metadata || {}),
          display_email: normalizedEmail,
          account_type: accountType,
        },
      });
      
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
      console.log("Account deletion requested:", { userId: user?.id, reason: deleteReason });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Sessão expirada. Faça login novamente.");
      }

      const { data, error } = await supabase.functions.invoke("delete-own-account", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { reason: deleteReason },
      });

      if (error) throw error;
      if (data && (data as any).error) throw new Error((data as any).error);

      // Clear any local drafts for this user.
      if (storageKey) {
        try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
      }

      await signOut();

      toast.success("Sua conta foi excluída com sucesso.");
      setDeleteDialogOpen(false);
      setOpen(false);

      // Redirect: professionals go to professional login; users go home.
      navigate(isProfessional ? "/profissional/auth" : "/", { replace: true });
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir conta");
    } finally {
      setLoadingDelete(false);
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const formatDocument = (value: string, type: string) => {
    const numbers = value.replace(/\D/g, '');
    if (type === 'cpf') {
      if (numbers.length <= 3) return numbers;
      if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
      if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
    } else {
      if (numbers.length <= 2) return numbers;
      if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
      if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
      if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
      return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
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
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-therapy">
              <Settings className="w-5 h-5" />
              Configurações da Conta
            </DialogTitle>
            <DialogDescription>
              Gerencie suas informações de login e conta
            </DialogDescription>
          </DialogHeader>

          {loadingProfile ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-therapy" />
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {/* Profile Data Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-card-foreground">
                  <User className="w-4 h-4" />
                  Dados Pessoais
                </div>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-muted-foreground text-xs">
                      Nome Completo
                    </Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Seu nome completo"
                    />
                  </div>

                  {isProfessional && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="crp" className="text-muted-foreground text-xs">
                          CRP
                        </Label>
                        <Input
                          id="crp"
                          value={crp}
                          onChange={(e) => setCrp(e.target.value)}
                          placeholder="00/00000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="birthDate" className="text-muted-foreground text-xs">
                          Nascimento
                        </Label>
                        <Input
                          id="birthDate"
                          type="date"
                          value={birthDate}
                          onChange={(e) => setBirthDate(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {!isProfessional && (
                    <div className="space-y-2">
                      <Label htmlFor="birthDate" className="text-muted-foreground text-xs">
                        Data de Nascimento
                      </Label>
                      <Input
                        id="birthDate"
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-muted-foreground text-xs">
                      Telefone com DDD
                    </Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                    />
                  </div>

                  {isProfessional && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-muted-foreground text-xs">
                          Tipo de Documento
                        </Label>
                        <Select value={documentType} onValueChange={setDocumentType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cpf">CPF</SelectItem>
                            <SelectItem value="cnpj">CNPJ</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="documentNumber" className="text-muted-foreground text-xs">
                          {documentType === 'cnpj' ? 'CNPJ' : 'CPF'}
                        </Label>
                        <Input
                          id="documentNumber"
                          value={documentNumber}
                          onChange={(e) => setDocumentNumber(formatDocument(e.target.value, documentType || 'cpf'))}
                          placeholder={documentType === 'cnpj' ? '00.000.000/0000-00' : '000.000.000-00'}
                          maxLength={documentType === 'cnpj' ? 18 : 14}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs">
                      Time do Coração
                    </Label>
                    <Select value={favoriteClubId} onValueChange={setFavoriteClubId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione seu time" />
                      </SelectTrigger>
                      <SelectContent>
                        {allBrazilianClubs.map((club) => (
                          <SelectItem key={club.id} value={club.id}>
                            {club.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-xs">
                        Estado
                      </Label>
                      <Select 
                        value={state} 
                        onValueChange={(value) => {
                          setState(value);
                          setCity("");
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                          {brazilianStates.map((st) => (
                            <SelectItem key={st.sigla} value={st.sigla}>
                              {st.sigla}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-xs">
                        Cidade
                      </Label>
                      <Select value={city} onValueChange={setCity} disabled={!state}>
                        <SelectTrigger>
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          {cities.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="w-full bg-therapy hover:bg-therapy/90 text-white"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Dados Pessoais"
                  )}
                </Button>
              </div>

              <div className="border-t border-border" />

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
                  disabled={loadingEmail || email.trim().toLowerCase() === currentDisplayEmail}
                  className="w-full bg-therapy hover:bg-therapy/90 text-white"
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
                      name="new_password"
                      autoComplete="new-password"
                      autoCorrect="off"
                      spellCheck={false}
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
                      name="confirm_new_password"
                      autoComplete="new-password"
                      autoCorrect="off"
                      spellCheck={false}
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
                  className="w-full bg-therapy hover:bg-therapy/90 text-white"
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
                  className="w-full"
                >
                  Excluir Minha Conta
                </Button>
              </div>
            </div>
          )}
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
