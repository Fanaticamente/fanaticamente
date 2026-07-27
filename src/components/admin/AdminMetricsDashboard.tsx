import { useState, useEffect } from "react";
import { 
  Users, UserCheck, Calendar, TrendingUp, DollarSign, 
  Activity, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2,
  XCircle, AlertCircle, BarChart3, PieChart
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, BarChart, Bar, Legend
} from "recharts";

interface ThemeStyles {
  bg: string;
  card: string;
  text: string;
  textMuted: string;
  border: string;
}

interface AdminMetricsDashboardProps {
  themeStyles: ThemeStyles;
  isDarkMode: boolean;
}

interface MetricsData {
  totalUsers: number;
  activeProfessionals: number;
  totalAppointments: number;
  confirmedAppointments: number;
  pendingAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  inProgressAppointments: number;
  monthlyGrowth: number;
  weeklyAppointments: { day: string; agendamentos: number }[];
  appointmentsByStatus: { name: string; value: number; color: string }[];
  recentActivity: { id: string; type: string; description: string; time: string }[];
}

const AdminMetricsDashboard = ({ themeStyles, isDarkMode }: AdminMetricsDashboardProps) => {
  const [metrics, setMetrics] = useState<MetricsData>({
    totalUsers: 0,
    activeProfessionals: 0,
    totalAppointments: 0,
    confirmedAppointments: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    inProgressAppointments: 0,
    monthlyGrowth: 0,
    weeklyAppointments: [],
    appointmentsByStatus: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);

      // Fetch total users (profiles count)
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Fetch active professionals
      const { count: professionalsCount } = await supabase
        .from("professionals")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // Status counts computed in the database (no full-table download)
      const statusCount = async (status?: string) => {
        let q = supabase.from("appointments").select("*", { count: "exact", head: true });
        if (status) q = q.eq("status", status);
        const { count } = await q;
        return count || 0;
      };

      const [
        totalAppointments,
        confirmedAppointments,
        pendingAppointments,
        completedAppointments,
        cancelledAppointments,
        inProgressAppointments,
      ] = await Promise.all([
        statusCount(),
        statusCount("confirmed"),
        statusCount("pending"),
        statusCount("completed"),
        statusCount("cancelled"),
        statusCount("in_progress"),
      ]);

      // Calculate weekly appointments (last 7 days) — only the window is fetched
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - 6);
      const { data: weekAppointments } = await supabase
        .from("appointments")
        .select("scheduled_date")
        .gte("scheduled_date", weekStart.toISOString().split("T")[0])
        .lte("scheduled_date", today.toISOString().split("T")[0])
        .limit(2000);
      const windowAppointments = weekAppointments || [];
      const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
      const weeklyData = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        const count = windowAppointments.filter(a => a.scheduled_date === dateStr).length;
        weeklyData.push({
          day: weekDays[date.getDay()],
          agendamentos: count
        });
      }

      // Appointments by status for pie chart
      const appointmentsByStatus = [
        { name: "Confirmados", value: confirmedAppointments, color: "#10b981" },
        { name: "Pendentes", value: pendingAppointments, color: "#f59e0b" },
        { name: "Concluídos", value: completedAppointments, color: "#3b82f6" },
        { name: "Em Atendimento", value: inProgressAppointments, color: "#8b5cf6" },
        { name: "Cancelados", value: cancelledAppointments, color: "#ef4444" }
      ].filter(item => item.value > 0);

      // Calculate monthly growth (compare this month vs last month users)
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const lastMonth = new Date(thisMonth);
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const { count: thisMonthUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thisMonth.toISOString());

      const { count: lastMonthUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", lastMonth.toISOString())
        .lt("created_at", thisMonth.toISOString());

      const growth = lastMonthUsers && lastMonthUsers > 0 
        ? Math.round(((thisMonthUsers || 0) - lastMonthUsers) / lastMonthUsers * 100)
        : 0;

      // Recent activity - get latest appointments
      const { data: recentAppointments } = await supabase
        .from("appointments")
        .select("id, status, created_at, scheduled_date")
        .order("created_at", { ascending: false })
        .limit(5);

      const recentActivity = (recentAppointments || []).map(a => ({
        id: a.id,
        type: a.status === "confirmed" ? "success" : a.status === "pending" ? "warning" : "info",
        description: `Agendamento ${a.status === "confirmed" ? "confirmado" : a.status === "pending" ? "pendente" : a.status === "completed" ? "concluído" : a.status === "cancelled" ? "cancelado" : "em andamento"} para ${new Date(a.scheduled_date).toLocaleDateString("pt-BR")}`,
        time: new Date(a.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
      }));

      setMetrics({
        totalUsers: usersCount || 0,
        activeProfessionals: professionalsCount || 0,
        totalAppointments,
        confirmedAppointments,
        pendingAppointments,
        completedAppointments,
        cancelledAppointments,
        inProgressAppointments,
        monthlyGrowth: growth,
        weeklyAppointments: weeklyData,
        appointmentsByStatus,
        recentActivity
      });
    } catch (error) {
      console.error("Error fetching metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { 
      label: "Total Usuários", 
      value: metrics.totalUsers.toLocaleString("pt-BR"), 
      icon: Users, 
      color: "bg-primary/20 text-primary",
      change: metrics.monthlyGrowth,
      changeType: metrics.monthlyGrowth >= 0 ? "up" : "down"
    },
    { 
      label: "Profissionais Ativos", 
      value: metrics.activeProfessionals.toLocaleString("pt-BR"), 
      icon: UserCheck, 
      color: "bg-secondary/20 text-secondary",
      change: null,
      changeType: null
    },
    { 
      label: "Agendamentos", 
      value: metrics.totalAppointments.toLocaleString("pt-BR"), 
      icon: Calendar, 
      color: "bg-blue-500/20 text-blue-500",
      change: null,
      changeType: null
    },
    { 
      label: "Crescimento Mensal", 
      value: `${metrics.monthlyGrowth >= 0 ? "+" : ""}${metrics.monthlyGrowth}%`, 
      icon: TrendingUp, 
      color: metrics.monthlyGrowth >= 0 ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500",
      change: null,
      changeType: metrics.monthlyGrowth >= 0 ? "up" : "down"
    },
  ];

  const appointmentStats = [
    { label: "Confirmados", value: metrics.confirmedAppointments, icon: CheckCircle2, color: "text-green-500" },
    { label: "Pendentes", value: metrics.pendingAppointments, icon: Clock, color: "text-yellow-500" },
    { label: "Em Atendimento", value: metrics.inProgressAppointments, icon: Activity, color: "text-purple-500" },
    { label: "Concluídos", value: metrics.completedAppointments, icon: CheckCircle2, color: "text-blue-500" },
    { label: "Cancelados", value: metrics.cancelledAppointments, icon: XCircle, color: "text-red-500" },
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
      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`${themeStyles.card} border ${themeStyles.border} rounded-xl p-4`}>
            <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className={`font-display text-3xl ${themeStyles.text}`}>{stat.value}</p>
            <div className="flex items-center gap-2">
              <p className={`${themeStyles.textMuted} text-sm`}>{stat.label}</p>
              {stat.change !== null && (
                <span className={`flex items-center text-xs ${stat.changeType === "up" ? "text-green-500" : "text-red-500"}`}>
                  {stat.changeType === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Appointment Status Cards */}
      <div className={`${themeStyles.card} border ${themeStyles.border} rounded-xl p-6`}>
        <h3 className={`font-display text-xl ${themeStyles.text} mb-4`}>Status dos Agendamentos</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {appointmentStats.map((stat) => (
            <div key={stat.label} className={`${themeStyles.bg} rounded-xl p-4 text-center`}>
              <stat.icon className={`w-8 h-8 mx-auto mb-2 ${stat.color}`} />
              <p className={`font-display text-2xl ${themeStyles.text}`}>{stat.value}</p>
              <p className={`${themeStyles.textMuted} text-sm`}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly Appointments Chart */}
        <div className={`${themeStyles.card} border ${themeStyles.border} rounded-xl p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-display text-xl ${themeStyles.text}`}>Agendamentos da Semana</h3>
            <BarChart3 className={`w-5 h-5 ${themeStyles.textMuted}`} />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.weeklyAppointments}>
                <defs>
                  <linearGradient id="colorAgendamentos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#333" : "#e5e7eb"} />
                <XAxis dataKey="day" stroke={isDarkMode ? "#9ca3af" : "#6b7280"} />
                <YAxis stroke={isDarkMode ? "#9ca3af" : "#6b7280"} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? "#252525" : "#fff",
                    border: `1px solid ${isDarkMode ? "#333" : "#e5e7eb"}`,
                    borderRadius: "8px",
                    color: isDarkMode ? "#fff" : "#000"
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="agendamentos" 
                  stroke="#10b981" 
                  fillOpacity={1} 
                  fill="url(#colorAgendamentos)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Appointments by Status Pie Chart */}
        <div className={`${themeStyles.card} border ${themeStyles.border} rounded-xl p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-display text-xl ${themeStyles.text}`}>Distribuição por Status</h3>
            <PieChart className={`w-5 h-5 ${themeStyles.textMuted}`} />
          </div>
          <div className="h-64">
            {metrics.appointmentsByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={metrics.appointmentsByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {metrics.appointmentsByStatus.map((entry, index) => (
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
                  />
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className={themeStyles.textMuted}>Nenhum agendamento encontrado</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className={`${themeStyles.card} border ${themeStyles.border} rounded-xl p-6`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-display text-xl ${themeStyles.text}`}>Atividade Recente</h3>
          <Activity className={`w-5 h-5 ${themeStyles.textMuted}`} />
        </div>
        <div className="space-y-4">
          {metrics.recentActivity.length > 0 ? (
            metrics.recentActivity.map((activity) => (
              <div key={activity.id} className={`flex items-center gap-4 p-3 ${themeStyles.bg} rounded-xl`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  activity.type === "success" ? "bg-green-500/20" :
                  activity.type === "warning" ? "bg-yellow-500/20" : "bg-blue-500/20"
                }`}>
                  {activity.type === "success" ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : activity.type === "warning" ? (
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <Activity className="w-5 h-5 text-blue-500" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`${themeStyles.text} text-sm`}>{activity.description}</p>
                  <p className={`${themeStyles.textMuted} text-xs`}>{activity.time}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className={themeStyles.textMuted}>Nenhuma atividade recente</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMetricsDashboard;
