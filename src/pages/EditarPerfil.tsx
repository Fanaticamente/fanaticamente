import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Mail, Lock, Trash2, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import UserDesktopLayout from "@/components/layout/UserDesktopLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { brazilianStates, getCitiesByState } from "@/data/brazilianStates";
import { allBrazilianClubs } from "@/data/allBrazilianClubs";
import { encodeAuthEmail, getDisplayAuthEmail } from "@/lib/appMode";

const deleteReasons = [
  { id: "not_using", label: "Não estou mais usando o aplicativo" },
  { id: "found_alternative", label: "Encontrei outra alternativa melhor" },
  { id: "privacy", label: "Preocupações com privacidade dos meus dados" },
  { id: "bad_experience", label: "Experiência ruim com o serviço" },
  { id: "other", label: "Outro motivo" },
];

const formatPhone = (value: string) => {
  const n = value.replace(/\D/g, "");
  if (n.length <= 2) return `(${n}`;
  if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7, 11)}`;
};

const inputClass =
  "w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--club-500)]";

const EditarPerfil = () => {
  const isMobile = useIsMobile();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const currentDisplayEmail = getDisplayAuthEmail(user);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [favoriteClubId, setFavoriteClubId] = useState("");
  const [cities, setCities] = useState<string[]>([]);

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");

  useEffect(() => {
    if (currentDisplayEmail) setEmail(currentDisplayEmail);
  }, [currentDisplayEmail]);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      if (data) {
        setFullName(data.full_name || "");
        setPhone(data.phone || "");
        setBirthDate(data.birth_date || "");
        setState(data.state || "");
        setCity(data.city || "");
        setFavoriteClubId(data.favorite_club_id || "");
      }
      setLoadingProfile(false);
    })();
  }, [user]);

  useEffect(() => {
    if (!state) { setCities([]); return; }
    getCitiesByState(state).then(setCities);
  }, [state]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase.from("profiles").update({
        full_name: fullName,
        phone,
        birth_date: birthDate || null,
        state,
        city,
        favorite_club_id: favoriteClubId || null,
        updated_at: new Date().toISOString(),
      }).eq("user_id", user.id);
      if (error) throw error;
      toast.success("Dados atualizados com sucesso!");
      try { window.dispatchEvent(new CustomEvent("club-theme-refresh")); } catch {}
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar dados");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdateEmail = async () => {
    const normalized = email.trim().toLowerCase();
    if (!normalized || normalized === currentDisplayEmail) {
      toast.info("Digite um novo e-mail para atualizar");
      return;
    }
    setLoadingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: encodeAuthEmail(normalized, "fan"),
        data: { ...(user?.user_metadata || {}), display_email: normalized, account_type: "fan" },
      });
      if (error) throw error;
      toast.success("Enviamos um e-mail de confirmação para o novo endereço.");
    } catch (e: any) {
      toast.error(e.message || "Erro ao atualizar e-mail");
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword) { toast.error("Digite uma nova senha"); return; }
    if (newPassword.length < 6) { toast.error("A senha deve ter pelo menos 6 caracteres"); return; }
    if (newPassword !== confirmPassword) { toast.error("As senhas não coincidem"); return; }
    setLoadingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Senha atualizada!");
      setNewPassword(""); setConfirmPassword("");
    } catch (e: any) {
      toast.error(e.message || "Erro ao atualizar senha");
    } finally { setLoadingPassword(false); }
  };

  const handleDeleteAccount = async () => {
    if (!deleteReason) { toast.error("Selecione um motivo"); return; }
    setLoadingDelete(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Sessão expirada. Faça login novamente.");
      const { data, error } = await supabase.functions.invoke("delete-own-account", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { reason: deleteReason },
      });
      if (error) throw error;
      if (data && (data as any).error) throw new Error((data as any).error);
      await signOut();
      toast.success("Sua conta foi excluída.");
      navigate("/", { replace: true });
    } catch (e: any) {
      toast.error(e.message || "Erro ao excluir conta");
    } finally {
      setLoadingDelete(false);
      setDeleteOpen(false);
    }
  };

  const Section = ({ icon: Icon, title, subtitle, children }: any) => (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 mb-4">
      <header className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-[var(--club-600)]" />
        <div>
          <h2 className="font-semibold text-slate-900 text-base normal-case">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </header>
      {children}
    </section>
  );

  const primaryBtn =
    "w-full h-11 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-60";

  const Content = () => (
    <div className="font-sans text-slate-900">
      {loadingProfile ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--club-600)]" />
        </div>
      ) : (
        <>
          <Section icon={User} title="Dados pessoais" subtitle="Suas informações de identificação">
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500">Nome completo</label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome" className={inputClass + " mt-1"} />
              </div>
              <div>
                <label className="text-xs text-slate-500">Data de nascimento</label>
                <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={inputClass + " mt-1"} />
              </div>
              <div>
                <label className="text-xs text-slate-500">Telefone com DDD</label>
                <input value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} placeholder="(11) 99999-9999" maxLength={15} className={inputClass + " mt-1"} />
              </div>
              <div>
                <label className="text-xs text-slate-500">Time do coração</label>
                <Select value={favoriteClubId} onValueChange={setFavoriteClubId}>
                  <SelectTrigger className="mt-1 h-11 rounded-xl border border-slate-200 bg-white text-slate-900 [&>span]:text-slate-900">
                    <SelectValue placeholder="Selecione seu time" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-slate-900 border-slate-200 max-h-72">
                    {allBrazilianClubs.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-slate-900 focus:bg-slate-100 focus:text-slate-900">{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500">Estado</label>
                  <Select value={state} onValueChange={(v) => { setState(v); setCity(""); }}>
                    <SelectTrigger className="mt-1 h-11 rounded-xl border border-slate-200 bg-white text-slate-900 [&>span]:text-slate-900"><SelectValue placeholder="Estado" /></SelectTrigger>
                    <SelectContent className="bg-white text-slate-900 border-slate-200 max-h-72">{brazilianStates.map((s) => (<SelectItem key={s.sigla} value={s.sigla} className="text-slate-900 focus:bg-slate-100 focus:text-slate-900">{s.sigla}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Cidade</label>
                  <Select value={city} onValueChange={setCity} disabled={!state}>
                    <SelectTrigger className="mt-1 h-11 rounded-xl border border-slate-200 bg-white text-slate-900 [&>span]:text-slate-900"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent className="bg-white text-slate-900 border-slate-200 max-h-72">{cities.map((c) => (<SelectItem key={c} value={c} className="text-slate-900 focus:bg-slate-100 focus:text-slate-900">{c}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
              </div>
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className={primaryBtn}
                style={{ background: "var(--club-600)", color: "var(--club-on)" }}
              >
                {savingProfile ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando…</> : "Salvar dados pessoais"}
              </button>
            </div>
          </Section>

          <Section icon={Mail} title="Alterar e-mail" subtitle="Você receberá um link de confirmação">
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500">E-mail</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className={inputClass + " mt-1"} />
              </div>
              <button
                onClick={handleUpdateEmail}
                disabled={loadingEmail || email.trim().toLowerCase() === currentDisplayEmail}
                className={primaryBtn}
                style={{ background: "var(--club-600)", color: "var(--club-on)" }}
              >
                {loadingEmail ? <><Loader2 className="w-4 h-4 animate-spin" /> Atualizando…</> : "Atualizar e-mail"}
              </button>
            </div>
          </Section>

          <Section icon={Lock} title="Alterar senha" subtitle="Use pelo menos 6 caracteres">
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500">Nova senha</label>
                <div className="relative mt-1">
                  <input type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className={inputClass + " pr-10"} />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500">Confirmar nova senha</label>
                <div className="relative mt-1">
                  <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className={inputClass + " pr-10"} />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                onClick={handleUpdatePassword}
                disabled={loadingPassword || !newPassword}
                className={primaryBtn}
                style={{ background: "var(--club-600)", color: "var(--club-on)" }}
              >
                {loadingPassword ? <><Loader2 className="w-4 h-4 animate-spin" /> Atualizando…</> : "Atualizar senha"}
              </button>
            </div>
          </Section>

          <Section icon={Trash2} title="Excluir conta" subtitle="Esta ação é irreversível">
            <p className="text-xs text-slate-500 mb-3">Ao excluir, todos os seus dados serão permanentemente removidos.</p>
            <button
              onClick={() => setDeleteOpen(true)}
              className="w-full h-11 rounded-xl font-semibold text-sm text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Excluir minha conta
            </button>
          </Section>
        </>
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-white text-slate-900 border-slate-200 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2 normal-case">
              <Trash2 className="w-5 h-5" /> Excluir conta
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              Tem certeza? Esta ação não pode ser desfeita. Nos conte o motivo:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <RadioGroup value={deleteReason} onValueChange={setDeleteReason} className="space-y-3 py-2">
            {deleteReasons.map((r) => (
              <div key={r.id} className="flex items-center space-x-3">
                <RadioGroupItem value={r.id} id={r.id} className="border-slate-300 text-red-600" />
                <Label htmlFor={r.id} className="text-sm cursor-pointer text-slate-800 font-normal">{r.label}</Label>
              </div>
            ))}
          </RadioGroup>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={loadingDelete || !deleteReason}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {loadingDelete ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Excluindo…</> : "Confirmar exclusão"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-white font-sans">
        <Header title="Editar perfil" />
        <main className="pt-[calc(56px+1cm)] px-4 pb-32">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-slate-500 mb-3">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <Content />
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <UserDesktopLayout title="Editar perfil" subtitle="Gerencie suas informações e conta">
      <Content />
    </UserDesktopLayout>
  );
};

export default EditarPerfil;