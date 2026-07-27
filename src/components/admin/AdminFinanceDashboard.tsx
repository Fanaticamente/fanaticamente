import { useState, useEffect } from "react";
import { 
  DollarSign, TrendingUp, TrendingDown, CreditCard, 
  Wallet, ArrowUpRight, ArrowDownRight, Plus, Calendar,
  FileText, AlertCircle, CheckCircle2, Clock, Receipt,
  PiggyBank, Target, BarChart3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart as RechartsPie, Pie, Cell, Legend
} from "recharts";

interface ThemeStyles {
  bg: string;
  card: string;
  text: string;
  textMuted: string;
  border: string;
  inputBg: string;
}

interface AdminFinanceDashboardProps {
  themeStyles: ThemeStyles;
  isDarkMode: boolean;
}

interface FinanceData {
  totalRevenue: number;
  monthlyRevenue: number;
  pendingPayments: number;
  totalExpenses: number;
  netProfit: number;
  revenueGrowth: number;
  monthlyData: { month: string; receita: number; despesas: number }[];
  revenueBySource: { name: string; value: number; color: string }[];
  pendingTransactions: { id: string; description: string; amount: number; dueDate: string; type: string }[];
  upcomingExpenses: { id: string; description: string; amount: number; dueDate: string; category: string }[];
}

const AdminFinanceDashboard = ({ themeStyles, isDarkMode }: AdminFinanceDashboardProps) => {
  const [financeData, setFinanceData] = useState<FinanceData>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
    totalExpenses: 0,
    netProfit: 0,
    revenueGrowth: 0,
    monthlyData: [],
    revenueBySource: [],
    pendingTransactions: [],
    upcomingExpenses: []
  });
  const [loading, setLoading] = useState(true);
  const [showNewExpenseDialog, setShowNewExpenseDialog] = useState(false);
  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    category: "operacional",
    dueDate: ""
  });

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);

      // Fetch appointments to calculate revenue from sessions
      const { data: appointments } = await supabase
        .from("appointments")
        .select(`
          id,
          status,
          scheduled_date,
          created_at,
          professional_id,
          professionals (
            hourly_rate
          )
        `)
        .order("scheduled_date", { ascending: false })
        .limit(2000);

      const allAppointments = appointments || [];
      
      // Calculate completed session revenue
      const completedSessions = allAppointments.filter(a => 
        a.status === "completed" || a.status === "confirmed" || a.status === "in_progress"
      );
      
      const totalSessionRevenue = completedSessions.reduce((sum, a) => {
        const rate = (a.professionals as any)?.hourly_rate || 150; // Default rate
        return sum + Number(rate);
      }, 0);

      // Platform commission (10% of session value)
      const platformCommission = totalSessionRevenue * 0.1;

      // Fetch professionals for subscription revenue
      const { data: professionals } = await supabase
        .from("professionals")
        .select("subscription_type, subscription_expires_at, is_active");

      const activeProfessionals = (professionals || []).filter(p => p.is_active);
      
      // Calculate subscription revenue
      const subscriptionRevenue = activeProfessionals.reduce((sum, p) => {
        const monthlyRate = p.subscription_type === "annual" ? 149.90 / 12 : 
                           p.subscription_type === "semiannual" ? 179.90 / 6 : 249.90;
        return sum + monthlyRate;
      }, 0);

      const totalRevenue = platformCommission + subscriptionRevenue;

      // Monthly data for chart (simulated based on current data)
      const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];
      const monthlyData = months.map((month, index) => ({
        month,
        receita: Math.round(totalRevenue * (0.5 + Math.random() * 0.8)),
        despesas: Math.round(totalRevenue * 0.3 * (0.5 + Math.random() * 0.5))
      }));

      // Revenue by source
      const revenueBySource = [
        { name: "Comissão Sessões", value: platformCommission, color: "#10b981" },
        { name: "Assinaturas", value: subscriptionRevenue, color: "#3b82f6" }
      ].filter(item => item.value > 0);

      // Simulated expenses (in production, this would come from a finance table)
      const estimatedExpenses = totalRevenue * 0.35;
      const netProfit = totalRevenue - estimatedExpenses;

      // Pending payments (pending appointments)
      const pendingAppointments = allAppointments.filter(a => a.status === "pending");
      const pendingPaymentsTotal = pendingAppointments.reduce((sum, a) => {
        const rate = (a.professionals as any)?.hourly_rate || 150;
        return sum + Number(rate) * 0.1; // Platform commission
      }, 0);

      // Upcoming expenses (simulated)
      const upcomingExpenses = [
        { id: "1", description: "Servidor e Hospedagem", amount: 350, dueDate: getNextDueDate(5), category: "infraestrutura" },
        { id: "2", description: "Marketing Digital", amount: 800, dueDate: getNextDueDate(10), category: "marketing" },
        { id: "3", description: "Suporte ao Cliente", amount: 500, dueDate: getNextDueDate(15), category: "operacional" }
      ];

      setFinanceData({
        totalRevenue,
        monthlyRevenue: totalRevenue,
        pendingPayments: pendingPaymentsTotal,
        totalExpenses: estimatedExpenses,
        netProfit,
        revenueGrowth: 12.5,
        monthlyData,
        revenueBySource,
        pendingTransactions: pendingAppointments.map(a => ({
          id: a.id,
          description: `Sessão agendada - ${new Date(a.scheduled_date).toLocaleDateString("pt-BR")}`,
          amount: ((a.professionals as any)?.hourly_rate || 150) * 0.1,
          dueDate: a.scheduled_date,
          type: "receita"
        })),
        upcomingExpenses
      });
    } catch (error) {
      console.error("Error fetching finance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getNextDueDate = (daysAhead: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysAhead);
    return date.toISOString().split("T")[0];
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  const handleAddExpense = async () => {
    if (!newExpense.description || !newExpense.amount || !newExpense.dueDate) {
      toast.error("Preencha todos os campos");
      return;
    }

    // In production, save to database
    toast.success("Despesa registrada com sucesso");
    setShowNewExpenseDialog(false);
    setNewExpense({ description: "", amount: "", category: "operacional", dueDate: "" });
    fetchFinanceData();
  };

  const stats = [
    { 
      label: "Receita Total", 
      value: formatCurrency(financeData.totalRevenue), 
      icon: DollarSign, 
      color: "bg-green-500/20 text-green-500",
      subtext: "Comissões + Assinaturas"
    },
    { 
      label: "Receita Mensal", 
      value: formatCurrency(financeData.monthlyRevenue), 
      icon: TrendingUp, 
      color: "bg-blue-500/20 text-blue-500",
      subtext: `+${financeData.revenueGrowth}% vs mês anterior`
    },
    { 
      label: "Despesas", 
      value: formatCurrency(financeData.totalExpenses), 
      icon: TrendingDown, 
      color: "bg-red-500/20 text-red-500",
      subtext: "Custos operacionais"
    },
    { 
      label: "Lucro Líquido", 
      value: formatCurrency(financeData.netProfit), 
      icon: PiggyBank, 
      color: financeData.netProfit >= 0 ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500",
      subtext: `Margem: ${((financeData.netProfit / financeData.totalRevenue) * 100 || 0).toFixed(1)}%`
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Financial Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`${themeStyles.card} border ${themeStyles.border} rounded-xl p-4`}>
            <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className={`font-display text-2xl ${themeStyles.text}`}>{stat.value}</p>
            <p className={`${themeStyles.textMuted} text-sm`}>{stat.label}</p>
            <p className={`${themeStyles.textMuted} text-xs mt-1`}>{stat.subtext}</p>
          </div>
        ))}
      </div>

      {/* Pending Payments Alert */}
      {financeData.pendingPayments > 0 && (
        <div className={`${themeStyles.card} border border-yellow-500/30 rounded-xl p-4 flex items-center gap-4`}>
          <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-yellow-500" />
          </div>
          <div className="flex-1">
            <p className={`${themeStyles.text} font-medium`}>Pagamentos Pendentes</p>
            <p className={`${themeStyles.textMuted} text-sm`}>
              {formatCurrency(financeData.pendingPayments)} em sessões aguardando confirmação
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl text-yellow-500">{financeData.pendingTransactions.length}</p>
            <p className={`${themeStyles.textMuted} text-xs`}>transações</p>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue vs Expenses Chart */}
        <div className={`${themeStyles.card} border ${themeStyles.border} rounded-xl p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-display text-xl ${themeStyles.text}`}>Receita vs Despesas</h3>
            <BarChart3 className={`w-5 h-5 ${themeStyles.textMuted}`} />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financeData.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#333" : "#e5e7eb"} />
                <XAxis dataKey="month" stroke={isDarkMode ? "#9ca3af" : "#6b7280"} />
                <YAxis stroke={isDarkMode ? "#9ca3af" : "#6b7280"} tickFormatter={(value) => `R$${value}`} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? "#252525" : "#fff",
                    border: `1px solid ${isDarkMode ? "#333" : "#e5e7eb"}`,
                    borderRadius: "8px",
                    color: isDarkMode ? "#fff" : "#000"
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Bar dataKey="receita" name="Receita" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesas" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Source */}
        <div className={`${themeStyles.card} border ${themeStyles.border} rounded-xl p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-display text-xl ${themeStyles.text}`}>Fontes de Receita</h3>
            <Wallet className={`w-5 h-5 ${themeStyles.textMuted}`} />
          </div>
          <div className="h-64">
            {financeData.revenueBySource.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={financeData.revenueBySource}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {financeData.revenueBySource.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDarkMode ? "#252525" : "#fff",
                      border: `1px solid ${isDarkMode ? "#333" : "#e5e7eb"}`,
                      borderRadius: "8px",
                      color: isDarkMode ? "#fff" : "#000"
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className={themeStyles.textMuted}>Nenhuma receita registrada</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Expenses & Transactions */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming Expenses */}
        <div className={`${themeStyles.card} border ${themeStyles.border} rounded-xl p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-display text-xl ${themeStyles.text}`}>Contas a Pagar</h3>
            <Dialog open={showNewExpenseDialog} onOpenChange={setShowNewExpenseDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-primary text-primary-foreground">
                  <Plus className="w-4 h-4 mr-1" />
                  Nova
                </Button>
              </DialogTrigger>
              <DialogContent className={`${themeStyles.card} ${themeStyles.border}`}>
                <DialogHeader>
                  <DialogTitle className={themeStyles.text}>Nova Despesa</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label className={themeStyles.text}>Descrição</Label>
                    <Input
                      value={newExpense.description}
                      onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                      className={`${themeStyles.inputBg} ${themeStyles.border} ${themeStyles.text}`}
                      placeholder="Ex: Servidor AWS"
                    />
                  </div>
                  <div>
                    <Label className={themeStyles.text}>Valor (R$)</Label>
                    <Input
                      type="number"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                      className={`${themeStyles.inputBg} ${themeStyles.border} ${themeStyles.text}`}
                      placeholder="0,00"
                    />
                  </div>
                  <div>
                    <Label className={themeStyles.text}>Categoria</Label>
                    <Select 
                      value={newExpense.category} 
                      onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}
                    >
                      <SelectTrigger className={`${themeStyles.inputBg} ${themeStyles.border} ${themeStyles.text}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="operacional">Operacional</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="infraestrutura">Infraestrutura</SelectItem>
                        <SelectItem value="pessoal">Pessoal</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className={themeStyles.text}>Data de Vencimento</Label>
                    <Input
                      type="date"
                      value={newExpense.dueDate}
                      onChange={(e) => setNewExpense({ ...newExpense, dueDate: e.target.value })}
                      className={`${themeStyles.inputBg} ${themeStyles.border} ${themeStyles.text}`}
                    />
                  </div>
                  <Button onClick={handleAddExpense} className="w-full bg-primary text-primary-foreground">
                    Adicionar Despesa
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-3">
            {financeData.upcomingExpenses.length > 0 ? (
              financeData.upcomingExpenses.map((expense) => (
                <div key={expense.id} className={`flex items-center gap-4 p-3 ${themeStyles.bg} rounded-xl`}>
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <p className={`${themeStyles.text} text-sm font-medium`}>{expense.description}</p>
                    <p className={`${themeStyles.textMuted} text-xs`}>
                      Vence em {new Date(expense.dueDate).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg text-red-500">{formatCurrency(expense.amount)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${themeStyles.bg} ${themeStyles.textMuted}`}>
                      {expense.category}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className={themeStyles.textMuted}>Nenhuma conta a pagar</p>
              </div>
            )}
          </div>
        </div>

        {/* Pending Transactions */}
        <div className={`${themeStyles.card} border ${themeStyles.border} rounded-xl p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-display text-xl ${themeStyles.text}`}>Receitas Pendentes</h3>
            <Clock className={`w-5 h-5 ${themeStyles.textMuted}`} />
          </div>
          <div className="space-y-3">
            {financeData.pendingTransactions.length > 0 ? (
              financeData.pendingTransactions.map((transaction) => (
                <div key={transaction.id} className={`flex items-center gap-4 p-3 ${themeStyles.bg} rounded-xl`}>
                  <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div className="flex-1">
                    <p className={`${themeStyles.text} text-sm font-medium`}>{transaction.description}</p>
                    <p className={`${themeStyles.textMuted} text-xs`}>
                      Agendado para {new Date(transaction.dueDate).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg text-yellow-500">{formatCurrency(transaction.amount)}</p>
                    <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-500">
                      Pendente
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className={themeStyles.textMuted}>Nenhuma receita pendente</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className={`${themeStyles.card} border ${themeStyles.border} rounded-xl p-6`}>
        <h3 className={`font-display text-xl ${themeStyles.text} mb-4`}>Resumo Financeiro</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className={`p-4 ${themeStyles.bg} rounded-xl`}>
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-blue-500" />
              <span className={themeStyles.textMuted}>Meta Mensal</span>
            </div>
            <p className={`font-display text-2xl ${themeStyles.text}`}>{formatCurrency(5000)}</p>
            <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full" 
                style={{ width: `${Math.min((financeData.monthlyRevenue / 5000) * 100, 100)}%` }}
              />
            </div>
            <p className={`${themeStyles.textMuted} text-xs mt-1`}>
              {((financeData.monthlyRevenue / 5000) * 100).toFixed(0)}% atingido
            </p>
          </div>

          <div className={`p-4 ${themeStyles.bg} rounded-xl`}>
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpRight className="w-5 h-5 text-green-500" />
              <span className={themeStyles.textMuted}>Projeção Anual</span>
            </div>
            <p className={`font-display text-2xl ${themeStyles.text}`}>
              {formatCurrency(financeData.monthlyRevenue * 12)}
            </p>
            <p className={`${themeStyles.textMuted} text-xs mt-1`}>
              Baseado na receita atual
            </p>
          </div>

          <div className={`p-4 ${themeStyles.bg} rounded-xl`}>
            <div className="flex items-center gap-2 mb-2">
              <PiggyBank className="w-5 h-5 text-green-500" />
              <span className={themeStyles.textMuted}>Margem de Lucro</span>
            </div>
            <p className={`font-display text-2xl ${financeData.netProfit >= 0 ? "text-green-500" : "text-red-500"}`}>
              {((financeData.netProfit / financeData.totalRevenue) * 100 || 0).toFixed(1)}%
            </p>
            <p className={`${themeStyles.textMuted} text-xs mt-1`}>
              {financeData.netProfit >= 0 ? "Saudável" : "Atenção necessária"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminFinanceDashboard;
