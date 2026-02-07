import { useState } from "react";
import { Download, Loader2, Database, Users, Calendar, FileText, Shield, MessageSquare, ClipboardList, BookOpen, Stethoscope, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ThemeStyles {
  bg: string;
  card: string;
  text: string;
  textMuted: string;
  border: string;
  hoverBg: string;
}

interface AdminDataExportProps {
  themeStyles: ThemeStyles;
}

interface ExportableTable {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  table: string;
  columns?: string;
}

const exportableTables: ExportableTable[] = [
  { id: "profiles", label: "Perfis de Usuários", description: "Nome, telefone, cidade, clube favorito", icon: Users, table: "profiles" },
  { id: "user_roles", label: "Roles de Usuários", description: "Papéis atribuídos (admin, profissional, etc.)", icon: Shield, table: "user_roles" },
  { id: "professionals", label: "Profissionais", description: "CRP, especialidades, status de aprovação", icon: Stethoscope, table: "professionals" },
  { id: "appointments", label: "Agendamentos", description: "Consultas, status, datas e horários", icon: Calendar, table: "appointments" },
  { id: "appointment_disputes", label: "Disputas", description: "Disputas de agendamentos", icon: MessageSquare, table: "appointment_disputes" },
  { id: "football_news", label: "Notícias de Futebol", description: "Notícias reescritas e originais", icon: FileText, table: "football_news" },
  { id: "clubs", label: "Clubes", description: "Clubes cadastrados no sistema", icon: Database, table: "clubs" },
  { id: "app_modules", label: "Módulos do App", description: "Configurações de seções e módulos", icon: ClipboardList, table: "app_modules" },
  { id: "app_pages", label: "Páginas do App", description: "Páginas e visibilidade", icon: Eye, table: "app_pages" },
  { id: "app_menus", label: "Menus do App", description: "Configurações de menus", icon: ClipboardList, table: "app_menus" },
  { id: "app_content", label: "Conteúdo do App", description: "Textos e configurações de conteúdo", icon: BookOpen, table: "app_content" },
  { id: "osmf_reports", label: "Denúncias OSMF", description: "Relatórios do observatório", icon: Shield, table: "osmf_reports" },
  { id: "clinical_notes", label: "Notas Clínicas", description: "Registros clínicos dos profissionais", icon: FileText, table: "clinical_notes" },
  { id: "clinical_observations", label: "Observações Clínicas", description: "Observações de sessões", icon: FileText, table: "clinical_observations" },
  { id: "therapeutic_plans", label: "Planos Terapêuticos", description: "Planos de tratamento", icon: ClipboardList, table: "therapeutic_plans" },
  { id: "case_reviews", label: "Revisões de Caso", description: "Avaliações e supervisões", icon: BookOpen, table: "case_reviews" },
  { id: "reference_library", label: "Biblioteca de Referências", description: "Material de apoio dos profissionais", icon: BookOpen, table: "reference_library" },
  { id: "professional_availability", label: "Disponibilidade", description: "Horários disponíveis dos profissionais", icon: Calendar, table: "professional_availability" },
  { id: "professional_weekly_availability", label: "Disponibilidade Semanal", description: "Grade semanal recorrente", icon: Calendar, table: "professional_weekly_availability" },
  { id: "admin_messages", label: "Mensagens Admin", description: "Comunicações entre admin e profissionais", icon: MessageSquare, table: "admin_messages" },
];

const convertToCSV = (data: Record<string, unknown>[]): string => {
  if (!data || data.length === 0) return "";
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","),
    ...data.map(row =>
      headers.map(h => {
        const val = row[h];
        const str = val === null || val === undefined ? "" : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      }).join(",")
    ),
  ];
  return csvRows.join("\n");
};

const downloadCSV = (csv: string, filename: string) => {
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const AdminDataExport = ({ themeStyles }: AdminDataExportProps) => {
  const [exporting, setExporting] = useState<Record<string, boolean>>({});
  const [exportingAll, setExportingAll] = useState(false);

  const handleExport = async (table: ExportableTable) => {
    setExporting(prev => ({ ...prev, [table.id]: true }));
    try {
      // Fetch all rows (paginate to avoid 1000 limit)
      let allData: Record<string, unknown>[] = [];
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await (supabase.from(table.table as any).select("*").range(from, from + pageSize - 1) as any);
        if (error) throw error;
        if (data && data.length > 0) {
          allData = [...allData, ...data];
          from += pageSize;
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      if (allData.length === 0) {
        toast.info(`${table.label}: nenhum dado encontrado`);
        return;
      }

      const csv = convertToCSV(allData);
      downloadCSV(csv, table.table);
      toast.success(`${table.label}: ${allData.length} registros exportados`);
    } catch (err: any) {
      console.error(`Export error for ${table.table}:`, err);
      toast.error(`Erro ao exportar ${table.label}: ${err.message}`);
    } finally {
      setExporting(prev => ({ ...prev, [table.id]: false }));
    }
  };

  const handleExportAll = async () => {
    setExportingAll(true);
    let successCount = 0;
    let errorCount = 0;

    for (const table of exportableTables) {
      try {
        let allData: Record<string, unknown>[] = [];
        let from = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await (supabase.from(table.table as any).select("*").range(from, from + pageSize - 1) as any);
          if (error) throw error;
          if (data && data.length > 0) {
            allData = [...allData, ...data];
            from += pageSize;
            hasMore = data.length === pageSize;
          } else {
            hasMore = false;
          }
        }

        if (allData.length > 0) {
          const csv = convertToCSV(allData);
          downloadCSV(csv, table.table);
          successCount++;
        }
      } catch (err) {
        console.error(`Export error for ${table.table}:`, err);
        errorCount++;
      }
    }

    if (successCount > 0) toast.success(`${successCount} tabelas exportadas com sucesso`);
    if (errorCount > 0) toast.error(`${errorCount} tabelas falharam na exportação`);
    setExportingAll(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`${themeStyles.card} border ${themeStyles.border} rounded-xl p-6`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`font-display text-xl ${themeStyles.text}`}>Exportar Dados</h2>
            <p className={`${themeStyles.textMuted} text-sm mt-1`}>
              Exporte os dados do banco de dados em formato CSV
            </p>
          </div>
          <button
            onClick={handleExportAll}
            disabled={exportingAll}
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {exportingAll ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Exportar Tudo
          </button>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exportableTables.map((table) => {
          const Icon = table.icon;
          const isLoading = exporting[table.id];

          return (
            <div
              key={table.id}
              className={`${themeStyles.card} border ${themeStyles.border} rounded-xl p-4 flex items-center gap-4`}
            >
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`${themeStyles.text} font-medium text-sm truncate`}>{table.label}</p>
                <p className={`${themeStyles.textMuted} text-xs truncate`}>{table.description}</p>
              </div>
              <button
                onClick={() => handleExport(table)}
                disabled={isLoading}
                className={`p-2 rounded-lg ${themeStyles.hoverBg} transition-colors disabled:opacity-50 flex-shrink-0`}
                title={`Exportar ${table.label}`}
              >
                {isLoading ? (
                  <Loader2 className={`w-4 h-4 animate-spin ${themeStyles.textMuted}`} />
                ) : (
                  <Download className={`w-4 h-4 ${themeStyles.textMuted}`} />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminDataExport;
