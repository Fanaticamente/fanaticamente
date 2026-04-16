import { useState, useEffect } from "react";
import { Plus, Trash2, Tag, Percent, DollarSign, Copy, ToggleLeft, ToggleRight, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface ThemeStyles {
  bg: string;
  card: string;
  text: string;
  textMuted: string;
  border: string;
  inputBg: string;
}

interface AdminCouponManagerProps {
  themeStyles: ThemeStyles;
  isDarkMode: boolean;
}

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  max_uses: number | null;
  current_uses: number;
  min_amount: number | null;
  applicable_to: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

const AdminCouponManager = ({ themeStyles, isDarkMode }: AdminCouponManagerProps) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: "",
    max_uses: "",
    min_amount: "",
    applicable_to: "all",
    expires_at: ""
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (err) {
      console.error("Error fetching coupons:", err);
      toast.error("Erro ao carregar cupons");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async () => {
    if (!newCoupon.code || !newCoupon.discount_value) {
      toast.error("Preencha o código e o valor do desconto");
      return;
    }

    const discountValue = parseFloat(newCoupon.discount_value);
    if (newCoupon.discount_type === "percentage" && (discountValue <= 0 || discountValue > 100)) {
      toast.error("Percentual deve ser entre 1 e 100");
      return;
    }

    try {
      const couponData: any = {
        code: newCoupon.code.toUpperCase().trim(),
        description: newCoupon.description || null,
        discount_type: newCoupon.discount_type,
        discount_value: discountValue,
        applicable_to: newCoupon.applicable_to,
        is_active: true
      };

      if (newCoupon.max_uses) couponData.max_uses = parseInt(newCoupon.max_uses);
      if (newCoupon.min_amount) couponData.min_amount = parseFloat(newCoupon.min_amount);
      if (newCoupon.expires_at) couponData.expires_at = new Date(newCoupon.expires_at).toISOString();

      const { error } = await supabase.from("coupons").insert(couponData);

      if (error) {
        if (error.code === "23505") {
          toast.error("Já existe um cupom com esse código");
          return;
        }
        throw error;
      }

      toast.success("Cupom criado com sucesso!");
      setShowCreateDialog(false);
      setNewCoupon({ code: "", description: "", discount_type: "percentage", discount_value: "", max_uses: "", min_amount: "", applicable_to: "all", expires_at: "" });
      fetchCoupons();
    } catch (err) {
      console.error("Error creating coupon:", err);
      toast.error("Erro ao criar cupom");
    }
  };

  const toggleCouponStatus = async (couponId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("coupons")
        .update({ is_active: !currentStatus })
        .eq("id", couponId);

      if (error) throw error;
      toast.success(currentStatus ? "Cupom desativado" : "Cupom ativado");
      fetchCoupons();
    } catch (err) {
      toast.error("Erro ao atualizar cupom");
    }
  };

  const deleteCoupon = async (couponId: string) => {
    if (!confirm("Tem certeza que deseja excluir este cupom?")) return;

    try {
      const { error } = await supabase.from("coupons").delete().eq("id", couponId);
      if (error) throw error;
      toast.success("Cupom excluído");
      fetchCoupons();
    } catch (err) {
      toast.error("Erro ao excluir cupom");
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Código "${code}" copiado!`);
  };

  const applicableLabels: Record<string, string> = {
    all: "Todos",
    subscription: "Assinatura",
    course: "Curso",
    membership: "Membership"
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`font-display text-2xl ${themeStyles.text}`}>Gerenciador de Cupons</h2>
          <p className={`${themeStyles.textMuted} text-sm mt-1`}>Crie e gerencie cupons de desconto para a plataforma</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-secondary text-secondary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Novo Cupom
            </Button>
          </DialogTrigger>
          <DialogContent className={`${themeStyles.card} border ${themeStyles.border} max-w-md`}>
            <DialogHeader>
              <DialogTitle className={themeStyles.text}>Criar Cupom de Desconto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label className={themeStyles.textMuted}>Código do Cupom</Label>
                <Input
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                  placeholder="EX: DESCONTO20"
                  className={`${themeStyles.inputBg} border ${themeStyles.border} ${themeStyles.text} uppercase`}
                />
              </div>
              <div>
                <Label className={themeStyles.textMuted}>Descrição (opcional)</Label>
                <Input
                  value={newCoupon.description}
                  onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
                  placeholder="Cupom de boas-vindas"
                  className={`${themeStyles.inputBg} border ${themeStyles.border} ${themeStyles.text}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className={themeStyles.textMuted}>Tipo de Desconto</Label>
                  <Select value={newCoupon.discount_type} onValueChange={(v) => setNewCoupon({ ...newCoupon, discount_type: v })}>
                    <SelectTrigger className={`${themeStyles.inputBg} border ${themeStyles.border} ${themeStyles.text}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentual (%)</SelectItem>
                      <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className={themeStyles.textMuted}>Valor</Label>
                  <Input
                    type="number"
                    value={newCoupon.discount_value}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discount_value: e.target.value })}
                    placeholder={newCoupon.discount_type === "percentage" ? "20" : "50.00"}
                    className={`${themeStyles.inputBg} border ${themeStyles.border} ${themeStyles.text}`}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className={themeStyles.textMuted}>Limite de Usos</Label>
                  <Input
                    type="number"
                    value={newCoupon.max_uses}
                    onChange={(e) => setNewCoupon({ ...newCoupon, max_uses: e.target.value })}
                    placeholder="Ilimitado"
                    className={`${themeStyles.inputBg} border ${themeStyles.border} ${themeStyles.text}`}
                  />
                </div>
                <div>
                  <Label className={themeStyles.textMuted}>Valor Mínimo (R$)</Label>
                  <Input
                    type="number"
                    value={newCoupon.min_amount}
                    onChange={(e) => setNewCoupon({ ...newCoupon, min_amount: e.target.value })}
                    placeholder="0"
                    className={`${themeStyles.inputBg} border ${themeStyles.border} ${themeStyles.text}`}
                  />
                </div>
              </div>
              <div>
                <Label className={themeStyles.textMuted}>Aplicável a</Label>
                <Select value={newCoupon.applicable_to} onValueChange={(v) => setNewCoupon({ ...newCoupon, applicable_to: v })}>
                  <SelectTrigger className={`${themeStyles.inputBg} border ${themeStyles.border} ${themeStyles.text}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os produtos</SelectItem>
                    <SelectItem value="subscription">Assinatura Profissional</SelectItem>
                    <SelectItem value="course">Cursos</SelectItem>
                    <SelectItem value="membership">Membership</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className={themeStyles.textMuted}>Data de Expiração (opcional)</Label>
                <Input
                  type="datetime-local"
                  value={newCoupon.expires_at}
                  onChange={(e) => setNewCoupon({ ...newCoupon, expires_at: e.target.value })}
                  className={`${themeStyles.inputBg} border ${themeStyles.border} ${themeStyles.text}`}
                />
              </div>
              <Button onClick={handleCreateCoupon} className="w-full bg-secondary text-secondary-foreground">
                Criar Cupom
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Coupons List */}
      {coupons.length === 0 ? (
        <div className={`${themeStyles.card} border ${themeStyles.border} rounded-xl p-12 text-center`}>
          <Tag className={`w-12 h-12 mx-auto mb-4 ${themeStyles.textMuted}`} />
          <p className={`${themeStyles.text} font-medium text-lg`}>Nenhum cupom criado</p>
          <p className={`${themeStyles.textMuted} text-sm mt-1`}>Clique em "Novo Cupom" para criar seu primeiro cupom de desconto</p>
        </div>
      ) : (
        <div className="space-y-3">
          {coupons.map((coupon) => {
            const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
            const isMaxedOut = coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses;

            return (
              <div
                key={coupon.id}
                className={`${themeStyles.card} border ${themeStyles.border} rounded-xl p-5 ${
                  !coupon.is_active || isExpired || isMaxedOut ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      coupon.discount_type === "percentage" ? "bg-blue-500/20" : "bg-green-500/20"
                    }`}>
                      {coupon.discount_type === "percentage" ? (
                        <Percent className="w-6 h-6 text-blue-500" />
                      ) : (
                        <DollarSign className="w-6 h-6 text-green-500" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyCode(coupon.code)}
                          className={`font-mono font-bold text-lg ${themeStyles.text} flex items-center gap-1 hover:opacity-70 transition-opacity`}
                        >
                          {coupon.code}
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {!coupon.is_active && (
                          <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-500 rounded-full">Inativo</span>
                        )}
                        {isExpired && (
                          <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-500 rounded-full">Expirado</span>
                        )}
                        {isMaxedOut && (
                          <span className="text-xs px-2 py-0.5 bg-orange-500/20 text-orange-500 rounded-full">Esgotado</span>
                        )}
                      </div>
                      {coupon.description && (
                        <p className={`${themeStyles.textMuted} text-sm mt-0.5`}>{coupon.description}</p>
                      )}
                      <div className={`flex items-center gap-3 mt-2 text-xs ${themeStyles.textMuted}`}>
                        <span>
                          {coupon.discount_type === "percentage"
                            ? `${coupon.discount_value}% de desconto`
                            : `R$ ${Number(coupon.discount_value).toFixed(2).replace(".", ",")} de desconto`}
                        </span>
                        <span>•</span>
                        <span>{applicableLabels[coupon.applicable_to]}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {coupon.current_uses}{coupon.max_uses ? `/${coupon.max_uses}` : ""} usos
                        </span>
                        {coupon.expires_at && (
                          <>
                            <span>•</span>
                            <span>Expira: {new Date(coupon.expires_at).toLocaleDateString("pt-BR")}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleCouponStatus(coupon.id, coupon.is_active)}
                      className="p-2 rounded-lg hover:bg-muted/30 transition-colors"
                      title={coupon.is_active ? "Desativar" : "Ativar"}
                    >
                      {coupon.is_active ? (
                        <ToggleRight className="w-5 h-5 text-green-500" />
                      ) : (
                        <ToggleLeft className={`w-5 h-5 ${themeStyles.textMuted}`} />
                      )}
                    </button>
                    <button
                      onClick={() => deleteCoupon(coupon.id)}
                      className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminCouponManager;
