import { useMemo } from "react";
import { Star, Calendar, TrendingUp, Users } from "lucide-react";
import { format, startOfWeek, addDays, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell
} from "recharts";

interface Appointment {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  rating?: number | null;
}

interface ProfessionalMetricsTabProps {
  appointments: Appointment[];
}

const ProfessionalMetricsTab = ({ appointments }: ProfessionalMetricsTabProps) => {
  // Calculate metrics based on completed appointments with ratings
  const metrics = useMemo(() => {
    const completedAppointments = appointments.filter(a => a.status === 'completed');
    const ratedAppointments = completedAppointments.filter(a => a.rating !== null && a.rating !== undefined);
    
    // Calculate average rating
    const totalRating = ratedAppointments.reduce((sum, a) => sum + (a.rating || 0), 0);
    const averageRating = ratedAppointments.length > 0 ? totalRating / ratedAppointments.length : 0;
    
    // Calculate rating distribution for pie chart
    const ratingDistribution = [1, 2, 3, 4, 5]
      .map((star) => ({
        name: `${star} estrela${star > 1 ? "s" : ""}`,
        value: ratedAppointments.filter((a) => a.rating === star).length,
        color:
          star >= 4
            ? "hsl(var(--therapy))"
            : star === 3
              ? "hsl(var(--primary))"
              : "hsl(var(--destructive))",
      }))
      .filter((item) => item.value > 0);
    
    // Calculate weekly appointments for the last 4 weeks
    const today = new Date();
    const weeklyData = [];
    
    for (let i = 3; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(today, i), { weekStartsOn: 1 });
      const weekEnd = addDays(weekStart, 6);
      
      const weekAppointments = completedAppointments.filter(a => {
        const appointmentDate = new Date(a.scheduled_date);
        return appointmentDate >= weekStart && appointmentDate <= weekEnd;
      });
      
      weeklyData.push({
        week: format(weekStart, "dd/MM", { locale: ptBR }),
        consultas: weekAppointments.length
      });
    }
    
    return {
      totalCompleted: completedAppointments.length,
      totalRated: ratedAppointments.length,
      averageRating,
      ratingDistribution,
      weeklyData
    };
  }, [appointments]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= Math.round(rating)
                ? "fill-primary text-primary"
                : "text-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div>
      <h2 className="font-display text-2xl text-card-foreground mb-4">
        Métricas de Desempenho
      </h2>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="w-10 h-10 rounded-xl bg-therapy/20 flex items-center justify-center mb-3">
            <Calendar className="w-5 h-5 text-therapy" />
          </div>
          <p className="font-display text-3xl text-card-foreground">{metrics.totalCompleted}</p>
          <p className="text-muted-foreground text-sm">Consultas Realizadas</p>
        </div>
        
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center mb-3">
            <Star className="w-5 h-5 text-primary" />
          </div>
          <p className="font-display text-3xl text-card-foreground">
            {metrics.averageRating > 0 ? metrics.averageRating.toFixed(1) : "-"}
          </p>
          <p className="text-muted-foreground text-sm">Avaliação Média</p>
        </div>
        
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="font-display text-3xl text-card-foreground">{metrics.totalRated}</p>
          <p className="text-muted-foreground text-sm">Avaliações Recebidas</p>
        </div>
        
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center mb-3">
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <p className="font-display text-3xl text-card-foreground">
            {metrics.totalRated > 0 ? `${Math.round((metrics.totalRated / metrics.totalCompleted) * 100)}%` : "0%"}
          </p>
          <p className="text-muted-foreground text-sm">Taxa de Resposta</p>
        </div>
      </div>
      
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Weekly Appointments Chart */}
          <div>
            <h3 className="font-medium text-card-foreground mb-4">Consultas por Semana</h3>
            <div className="h-48">
              {metrics.weeklyData.some(d => d.consultas > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics.weeklyData}>
                    <defs>
                      <linearGradient id="colorConsultas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--therapy))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--therapy))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--card-foreground))"
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="consultas" 
                      stroke="hsl(var(--therapy))" 
                      fillOpacity={1} 
                      fill="url(#colorConsultas)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full bg-muted/50 rounded-xl flex items-center justify-center">
                  <span className="text-muted-foreground">Nenhuma consulta realizada ainda</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Satisfaction Rate */}
          <div>
            <h3 className="font-medium text-card-foreground mb-4">Taxa de Satisfação</h3>
            <div className="h-48">
              {metrics.ratingDistribution.length > 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="flex items-center gap-3 mb-4">
                    {renderStars(metrics.averageRating)}
                    <span className="text-2xl font-bold text-card-foreground">
                      {metrics.averageRating.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm mb-4">
                    Baseado em {metrics.totalRated} avaliação{metrics.totalRated !== 1 ? 'ões' : ''}
                  </p>
                  <ResponsiveContainer width="100%" height={100}>
                    <RechartsPie>
                      <Pie
                        data={metrics.ratingDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={45}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {metrics.ratingDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          color: "hsl(var(--card-foreground))"
                        }}
                      />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-full bg-muted/50 rounded-xl flex items-center justify-center">
                  <span className="text-muted-foreground">Nenhuma avaliação recebida ainda</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalMetricsTab;