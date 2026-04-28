import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, Plus, Trash2, Crown } from "lucide-react";

interface Plan {
  id: string;
  plan_id: string;
  name: string;
  price: number;
  original_price: number | null;
  discount: number | null;
  period: string;
  features: string[];
  is_active: boolean;
  is_popular: boolean;
  order_index: number;
}

interface Settings {
  id: string;
  subscriptions_enabled: boolean;
  free_period_banner_enabled: boolean;
  free_period_banner_text: string;
  reactivation_warning_enabled: boolean;
  reactivation_warning_text: string;
  onboarding_subscription_text: string;
  onboarding_subscription_subtitle: string;
}

interface ActiveSubscription {
  id: string;
  user_id: string;
  subscription_type: string | null;
  subscription_expires_at: string | null;
  approval_status: string | null;
  is_active: boolean;
  full_name?: string | null;
}

interface Props {
  themeStyles: any;
}

const AdminSubscriptionsManager = ({ themeStyles }: Props) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [subs, setSubs] = useState<ActiveSubscription[]>([]);
  const [activeView, setActiveView] = useState<"settings" | "plans" | "subscriptions">("settings");

  const load = async () => {
    setLoading(true);
    const [{ data: p }, { data: s }, { data: profs }] = await Promise.all([
      supabase.from("subscription_plans").select("*").order("order_index"),
      supabase.from("subscription_settings").select("*").limit(1).maybeSingle(),
      supabase.from("professionals").select("id, user_id, subscription_type, subscription_expires_at, approval_status, is_active").order("created_at", { ascending: false }).limit(200),
    ]);

    let merged: ActiveSubscription[] = (profs ?? []).map((pr: any) => ({ ...pr, full_name: null }));
    if (merged.length > 0) {
      const userIds = merged.map(m => m.user_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
      const map = new Map((profiles ?? []).map((x: any) => [x.user_id, x.full_name]));
      merged = merged.map(m => ({ ...m, full_name: map.get(m.user_id) ?? null }));
    }

    setPlans((p ?? []).map((x: any) => ({ ...x, features: Array.isArray(x.features) ? x.features : [] })));
    setSettings(s as Settings | null);
    setSubs(merged);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateSettings = (patch: Partial<Settings>) => {
    if (!settings) return;
    setSettings({ ...settings, ...patch });
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    const { error } = await supabase.from("subscription_settings").update({
      subscriptions_enabled: settings.subscriptions_enabled,
      free_period_banner_enabled: settings.free_period_banner_enabled,
      free_period_banner_text: settings.free_period_banner_text,
      reactivation_warning_enabled: settings.reactivation_warning_enabled,
      reactivation_warning_text: settings.reactivation_warning_text,
      onboarding_subscription_text: settings.onboarding_subscription_text,
      onboarding_subscription_subtitle: settings.onboarding_subscription_subtitle,
    }).eq("id", settings.id);
    setSaving(false);
    if (error) toast.error("Erro ao salvar"); else toast.success("Configurações salvas!");
  };

  const updatePlan = (idx: number, patch: Partial<Plan>) => {
    setPlans(prev => prev.map((p, i) => i === idx ? { ...p, ...patch } : p));
  };

  const savePlan = async (plan: Plan) => {
    setSaving(true);
    const { error } = await supabase.from("subscription_plans").update({
      name: plan.name,
      price: plan.price,
      original_price: plan.original_price,
      discount: plan.discount,
      period: plan.period,
      features: plan.features,
      is_active: plan.is_active,
      is_popular: plan.is_popular,
      order_index: plan.order_index,
    }).eq("id", plan.id);
    setSaving(false);
    if (error) toast.error("Erro ao salvar plano"); else toast.success(`Plano ${plan.name} salvo!`);
  };

  const cancelProfessionalSubscription = async (id: string) => {
    if (!confirm("Cancelar assinatura deste profissional?")) return;
    const { error } = await supabase.from("professionals").update({
      subscription_expires_at: null,
      approval_status: "cancelled",
    }).eq("id", id);
    if (error) toast.error("Erro ao cancelar"); else { toast.success("Cancelado"); load(); }
  };

  const extendProfessionalSubscription = async (id: string, currentExpiry: string | null) => {
    const days = prompt("Estender por quantos dias?", "30");
    if (!days) return;
    const base = currentExpiry && new Date(currentExpiry) > new Date() ? new Date(currentExpiry) : new Date();
    base.setDate(base.getDate() + parseInt(days, 10));
    const { error } = await supabase.from("professionals").update({
      subscription_expires_at: base.toISOString(),
      approval_status: "approved",
    }).eq("id", id);
    if (error) toast.error("Erro ao estender"); else { toast.success("Estendido"); load(); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-secondary" /></div>;

  const inputCls = `w-full px-3 py-2 ${themeStyles.inputBg} border ${themeStyles.border} rounded-lg ${themeStyles.text} focus:border-secondary focus:outline-none`;
  const labelCls = `block text-xs font-semibold uppercase tracking-wide ${themeStyles.textMuted} mb-1`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`font-display text-2xl ${themeStyles.text} mb-1`}>Gerenciador de Assinaturas</h2>
        <p className={`text-sm ${themeStyles.textMuted}`}>Controle os planos, configurações globais e assinaturas dos profissionais.</p>
      </div>

      {/* Sub-tabs */}
      <div className={`flex gap-2 border-b ${themeStyles.border}`}>
        {[
          { id: "settings", label: "Configurações Gerais" },
          { id: "plans", label: "Planos" },
          { id: "subscriptions", label: `Assinaturas Ativas (${subs.length})` },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveView(t.id as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeView === t.id ? "border-secondary text-secondary" : `border-transparent ${themeStyles.textMuted}`
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* SETTINGS */}
      {activeView === "settings" && settings && (
        <div className={`${themeStyles.card} border ${themeStyles.border} rounded-xl p-6 space-y-6`}>
          <div className={`flex items-center justify-between py-3 border-b ${themeStyles.border}`}>
            <div>
              <p className={`${themeStyles.text} font-medium`}>Assinaturas Habilitadas</p>
              <p className={`${themeStyles.textMuted} text-sm`}>Quando OFF: profissionais ativam o perfil sem pagar (período promocional).</p>
            </div>
            <button
              onClick={() => updateSettings({ subscriptions_enabled: !settings.subscriptions_enabled })}
              className={`w-12 h-6 ${settings.subscriptions_enabled ? "bg-secondary" : "bg-gray-400"} rounded-full relative transition-colors`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.subscriptions_enabled ? "left-7" : "left-1"}`} />
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className={`${themeStyles.text} font-medium`}>Banner Período Gratuito</label>
              <button
                onClick={() => updateSettings({ free_period_banner_enabled: !settings.free_period_banner_enabled })}
                className={`w-12 h-6 ${settings.free_period_banner_enabled ? "bg-secondary" : "bg-gray-400"} rounded-full relative transition-colors`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.free_period_banner_enabled ? "left-7" : "left-1"}`} />
              </button>
            </div>
            <textarea
              rows={2}
              value={settings.free_period_banner_text}
              onChange={(e) => updateSettings({ free_period_banner_text: e.target.value })}
              className={inputCls}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className={`${themeStyles.text} font-medium`}>Aviso de Reativação</label>
              <button
                onClick={() => updateSettings({ reactivation_warning_enabled: !settings.reactivation_warning_enabled })}
                className={`w-12 h-6 ${settings.reactivation_warning_enabled ? "bg-secondary" : "bg-gray-400"} rounded-full relative transition-colors`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.reactivation_warning_enabled ? "left-7" : "left-1"}`} />
              </button>
            </div>
            <textarea
              rows={3}
              value={settings.reactivation_warning_text}
              onChange={(e) => updateSettings({ reactivation_warning_text: e.target.value })}
              className={inputCls}
            />
          </div>

          <div className="space-y-3">
            <div>
              <label className={labelCls}>Título do passo de assinatura no onboarding</label>
              <input
                value={settings.onboarding_subscription_text}
                onChange={(e) => updateSettings({ onboarding_subscription_text: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Subtítulo do passo de assinatura</label>
              <input
                value={settings.onboarding_subscription_subtitle}
                onChange={(e) => updateSettings({ onboarding_subscription_subtitle: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>

          <button
            onClick={saveSettings}
            disabled={saving}
            className="bg-secondary text-secondary-foreground px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar Configurações
          </button>
        </div>
      )}

      {/* PLANS */}
      {activeView === "plans" && (
        <div className="space-y-4">
          {plans.map((plan, idx) => (
            <div key={plan.id} className={`${themeStyles.card} border ${themeStyles.border} rounded-xl p-5 space-y-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-secondary" />
                  <h3 className={`font-display text-lg ${themeStyles.text}`}>{plan.name}</h3>
                  <code className={`text-xs ${themeStyles.textMuted} px-2 py-0.5 rounded ${themeStyles.inputBg}`}>{plan.plan_id}</code>
                </div>
                <div className="flex items-center gap-3">
                  <label className={`flex items-center gap-2 text-sm ${themeStyles.text}`}>
                    <input type="checkbox" checked={plan.is_active} onChange={(e) => updatePlan(idx, { is_active: e.target.checked })} />
                    Ativo
                  </label>
                  <label className={`flex items-center gap-2 text-sm ${themeStyles.text}`}>
                    <input type="checkbox" checked={plan.is_popular} onChange={(e) => updatePlan(idx, { is_popular: e.target.checked })} />
                    Popular
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className={labelCls}>Nome</label>
                  <input value={plan.name} onChange={(e) => updatePlan(idx, { name: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Preço (R$)</label>
                  <input type="number" step="0.01" value={plan.price} onChange={(e) => updatePlan(idx, { price: parseFloat(e.target.value) || 0 })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Preço Original (R$)</label>
                  <input type="number" step="0.01" value={plan.original_price ?? ""} onChange={(e) => updatePlan(idx, { original_price: e.target.value ? parseFloat(e.target.value) : null })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Desconto (%)</label>
                  <input type="number" value={plan.discount ?? ""} onChange={(e) => updatePlan(idx, { discount: e.target.value ? parseInt(e.target.value, 10) : null })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Período</label>
                  <input value={plan.period} onChange={(e) => updatePlan(idx, { period: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Ordem</label>
                  <input type="number" value={plan.order_index} onChange={(e) => updatePlan(idx, { order_index: parseInt(e.target.value, 10) || 0 })} className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Features (uma por linha)</label>
                <textarea
                  rows={4}
                  value={plan.features.join("\n")}
                  onChange={(e) => updatePlan(idx, { features: e.target.value.split("\n").filter(Boolean) })}
                  className={inputCls}
                />
              </div>

              <button
                onClick={() => savePlan(plan)}
                disabled={saving}
                className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Salvar Plano
              </button>
            </div>
          ))}
        </div>
      )}

      {/* SUBSCRIPTIONS */}
      {activeView === "subscriptions" && (
        <div className={`${themeStyles.card} border ${themeStyles.border} rounded-xl overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={themeStyles.tableBg}>
                <tr>
                  <th className={`text-left px-4 py-3 ${themeStyles.textMuted} font-medium`}>Profissional</th>
                  <th className={`text-left px-4 py-3 ${themeStyles.textMuted} font-medium`}>Plano</th>
                  <th className={`text-left px-4 py-3 ${themeStyles.textMuted} font-medium`}>Vencimento</th>
                  <th className={`text-left px-4 py-3 ${themeStyles.textMuted} font-medium`}>Status</th>
                  <th className={`text-right px-4 py-3 ${themeStyles.textMuted} font-medium`}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {subs.map(s => (
                  <tr key={s.id} className={`border-t ${themeStyles.border}`}>
                    <td className={`px-4 py-3 ${themeStyles.text}`}>{s.full_name || s.user_id.slice(0, 8)}</td>
                    <td className={`px-4 py-3 ${themeStyles.text}`}>{s.subscription_type ?? "—"}</td>
                    <td className={`px-4 py-3 ${themeStyles.text}`}>
                      {s.subscription_expires_at ? new Date(s.subscription_expires_at).toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td className={`px-4 py-3`}>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        s.approval_status === "approved" ? "bg-green-500/20 text-green-600" :
                        s.approval_status === "pending_approval" ? "bg-amber-500/20 text-amber-600" :
                        s.approval_status === "cancelled" ? "bg-red-500/20 text-red-600" :
                        "bg-gray-500/20 text-gray-600"
                      }`}>
                        {s.approval_status ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => extendProfessionalSubscription(s.id, s.subscription_expires_at)} className="text-xs text-secondary hover:underline mr-3">Estender</button>
                      <button onClick={() => cancelProfessionalSubscription(s.id)} className="text-xs text-red-500 hover:underline">Cancelar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubscriptionsManager;