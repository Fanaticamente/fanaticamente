import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle2, Clock, AlertCircle, ExternalLink, Receipt, BookOpen, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type PaymentItem = {
  id: string;
  type: "session" | "course";
  title: string;
  subtitle: string;
  amount: number;
  status: string | null;
  date: string;
  receiptUrl?: string | null;
};

const SessionPaymentsHistory = () => {
  const { user } = useAuth();
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);

  const { data: appointments, isLoading: loadingAppointments } = useQuery({
    queryKey: ["user-session-payments", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          professional:professionals(
            hourly_rate,
            user_id
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch professional names separately via profiles
      const professionalUserIds = [...new Set((data || []).map((a: any) => a.professional?.user_id).filter(Boolean))];
      let profilesMap: Record<string, string> = {};
      if (professionalUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", professionalUserIds);
        if (profiles) {
          profilesMap = Object.fromEntries(profiles.map(p => [p.user_id, p.full_name || "Profissional"]));
        }
      }
      
      return (data || []).map((a: any) => ({
        ...a,
        professional_name: a.professional?.user_id ? (profilesMap[a.professional.user_id] || "Profissional") : "Profissional",
      }));
    },
    enabled: !!user?.id,
  });

  const { data: courseAccess, isLoading: loadingCourses } = useQuery({
    queryKey: ["user-course-payments", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("user_course_access")
        .select(`
          *,
          course:courses(title, price)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch session receipts
  const { data: sessionReceipts } = useQuery({
    queryKey: ["session-receipts", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("session_receipts")
        .select("appointment_id, receipt_html, receipt_data")
        .eq("user_id", user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const receiptMap = new Map(
    (sessionReceipts || []).map((r) => [r.appointment_id, r.receipt_html])
  );

  const receiptDataMap = new Map(
    (sessionReceipts || []).map((r) => [r.appointment_id, r.receipt_data as any])
  );

  const isLoading = loadingAppointments || loadingCourses;

  // Merge and sort all payments
  const allPayments: PaymentItem[] = [
    ...(appointments || []).map((a: any) => {
      const receiptAmount = receiptDataMap.get(a.id)?.service?.amount;
      const hourlyRate = (a.professional as any)?.hourly_rate;
      const amount = receiptAmount != null && receiptAmount > 0 ? receiptAmount : (hourlyRate || 0);
      return {
        id: a.id,
        type: "session" as const,
        title: `Sessão com ${a.professional_name || "Profissional"}`,
        subtitle: `${format(new Date(a.scheduled_date), "dd 'de' MMM, yyyy", { locale: ptBR })} às ${a.scheduled_time}`,
        amount,
        status: a.status,
        date: a.created_at,
        receiptUrl: a.receipt_url,
      };
    }),
    ...(courseAccess || []).map((c) => ({
      id: c.id,
      type: "course" as const,
      title: `Curso: ${(c.course as any)?.title || "Curso"}`,
      subtitle: format(new Date(c.created_at), "dd 'de' MMM, yyyy", { locale: ptBR }),
      amount: (c.course as any)?.price || 0,
      status: "completed",
      date: c.created_at,
      receiptUrl: null,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleViewReceipt = (appointmentId: string) => {
    const html = receiptMap.get(appointmentId);
    if (html) setViewingReceipt(html);
  };

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadReceipt = async () => {
    if (!viewingReceipt) return;
    setIsGeneratingPdf(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: html2canvas } = await import("html2canvas");

      // Inject explicit white background into the receipt HTML
      const fixedHtml = viewingReceipt.replace(
        '<body>',
        '<body style="background-color: #ffffff !important; color: #1a1a1a !important;">'
      ).replace(
        /body\s*\{/,
        'html { background-color: #ffffff !important; } body { background-color: #ffffff !important; '
      );

      // Create a fully isolated container with CSS reset
      const wrapper = document.createElement("div");
      wrapper.style.cssText = `
        position: fixed; left: -9999px; top: 0; z-index: -1;
        width: 800px; height: auto;
        all: initial;
        background-color: #ffffff;
        font-family: 'Segoe UI', Arial, sans-serif;
      `;

      // Create shadow DOM to fully isolate from page styles
      const shadow = wrapper.attachShadow({ mode: "open" });

      // Parse and reconstruct
      const parser = new DOMParser();
      const doc = parser.parseFromString(fixedHtml, "text/html");

      // Build isolated content inside shadow DOM
      const container = document.createElement("div");
      container.style.cssText = "background-color: #ffffff; color: #1a1a1a; width: 800px;";

      // Copy styles
      const styles = doc.querySelectorAll("style");
      styles.forEach((s) => {
        const styleClone = document.createElement("style");
        styleClone.textContent = s.textContent || "";
        container.appendChild(styleClone);
      });

      // Add override styles
      const overrideStyle = document.createElement("style");
      overrideStyle.textContent = `
        *, *::before, *::after { color: inherit; }
        body, html, div { background-color: #ffffff; }
        .header { color: #1a1a1a; }
        .header h1 { color: #1a1a1a; }
        .header .receipt-number { color: #666666; }
        .section h3 { color: #1a1a1a; }
        .section p { color: #1a1a1a; }
        .service-info { background: #f8f8f8; color: #1a1a1a; }
        .row { color: #1a1a1a; }
        .footer-date { color: #666666; }
        .auth-footer .auth-text { color: #888888; }
      `;
      container.appendChild(overrideStyle);

      // Copy body content
      const bodyContent = doc.body.cloneNode(true) as HTMLElement;
      bodyContent.style.backgroundColor = "#ffffff";
      bodyContent.style.color = "#1a1a1a";
      bodyContent.style.maxWidth = "600px";
      bodyContent.style.margin = "40px auto";
      bodyContent.style.padding = "40px";
      container.appendChild(bodyContent);

      shadow.appendChild(container);
      document.body.appendChild(wrapper);

      // Wait for images (QR code) to load
      const images = container.querySelectorAll("img");
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete && img.naturalWidth > 0) return resolve();
              img.onload = () => resolve();
              img.onerror = () => resolve();
              // Timeout fallback
              setTimeout(resolve, 3000);
            })
        )
      );

      await new Promise((resolve) => setTimeout(resolve, 300));

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: 800,
        backgroundColor: "#ffffff",
      });

      document.body.removeChild(wrapper);

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF("p", "mm", "a4");
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save("recibo-atendimento.pdf");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "confirmed":
      case "completed":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Pago
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/20 border-amber-500/30">
            <Clock className="w-3 h-3 mr-1" /> Pendente
          </Badge>
        );
      case "cancelled":
      case "rejected":
        return (
          <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/20 border-red-500/30">
            <AlertCircle className="w-3 h-3 mr-1" /> Cancelado
          </Badge>
        );
      case "refund_pending":
        return (
          <Badge className="bg-orange-500/20 text-orange-400 hover:bg-orange-500/20 border-orange-500/30">
            <Clock className="w-3 h-3 mr-1" /> Reembolso
          </Badge>
        );
      case "refunded":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/20 border-blue-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Reembolsado
          </Badge>
        );
      default:
        return (
          <Badge className="bg-white/10 text-white/60 hover:bg-white/10">
            {status || "—"}
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-white/5 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (allPayments.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="mx-auto w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <Receipt className="w-7 h-7 text-white/30" />
        </div>
        <h3 className="text-base font-semibold text-white/80 mb-1">Nenhum pagamento encontrado</h3>
        <p className="text-sm text-white/40 max-w-xs mx-auto">
          Seus pagamentos de sessões e cursos aparecerão aqui.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {allPayments.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2.5 rounded-lg bg-white/10 shrink-0">
                {item.type === "course" ? (
                  <BookOpen className="w-4 h-4 text-amber-400" />
                ) : (
                  <Calendar className="w-4 h-4 text-white/60" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {item.title}
                </p>
                <p className="text-xs text-white/40">
                  {item.subtitle}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right">
                <p className="text-sm font-bold text-white">
                  R$ {item.amount.toFixed(2)}
                </p>
                {getStatusBadge(item.status)}
              </div>
              {item.type === "session" && receiptMap.has(item.id) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-emerald-400 hover:text-emerald-300 hover:bg-white/10 h-8 w-8"
                  onClick={() => handleViewReceipt(item.id)}
                  title="Ver recibo"
                >
                  <FileText className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Receipt Viewer Modal */}
      {viewingReceipt && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setViewingReceipt(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Recibo de Atendimento</h3>
              <button
                onClick={() => setViewingReceipt(null)}
                className="text-gray-500 hover:text-gray-700 text-lg font-bold"
              >
                X
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <iframe
                srcDoc={viewingReceipt}
                className="w-full h-[60vh] border-0"
                title="Recibo"
              />
            </div>
            <div className="p-4 border-t border-gray-200 flex gap-3">
              <Button
                onClick={handleDownloadReceipt}
                disabled={isGeneratingPdf}
                className="flex-1 bg-gray-900 hover:bg-gray-800 text-white"
              >
                <FileText className="w-4 h-4 mr-2" />
                {isGeneratingPdf ? "Gerando PDF..." : "Baixar PDF"}
              </Button>
              <Button
                className="bg-gray-900 hover:bg-gray-800 text-white"
                onClick={() => {
                  const printWindow = window.open("", "_blank");
                  if (printWindow) {
                    printWindow.document.write(viewingReceipt);
                    printWindow.document.close();
                    printWindow.print();
                  }
                }}
              >
                Imprimir
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SessionPaymentsHistory;
