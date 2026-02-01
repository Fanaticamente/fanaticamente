import React, { useState, useRef, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import {
  MapPin, BarChart3, Clock, Send, BookOpen, Shield, ChevronRight,
  Activity, Brain, Wine, MessageCircle, AlertTriangle, Upload, X, Check,
  Heart, Frown, Angry, Zap, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { allBrazilianClubs } from "@/data/allBrazilianClubs";
import DesktopHeader from "@/components/desktop/DesktopHeader";
import DesktopFooter from "@/components/desktop/DesktopFooter";

/* ===================== SECTION WRAPPER ===================== */
const Section = ({ id, children, className = "", dark = false }: { id: string; children: React.ReactNode; className?: string; dark?: boolean }) => {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6 }}
      className={`py-20 md:py-28 px-4 ${dark ? "bg-gray-900 text-white" : "bg-white text-gray-900"} ${className}`}
    >
      <div className="max-w-7xl mx-auto">{children}</div>
    </motion.section>
  );
};

/* ===================== HERO ===================== */
const HeroSection = () => (
  <section className="relative min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900 text-white overflow-hidden">
    {/* Animated background shapes */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl"
        animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
        transition={{ duration: 10, repeat: Infinity }}
        style={{ top: "10%", left: "10%" }}
      />
      <motion.div
        className="absolute w-72 h-72 rounded-full bg-blue-500/10 blur-3xl"
        animate={{ x: [0, -30, 0], y: [0, 50, 0] }}
        transition={{ duration: 12, repeat: Infinity }}
        style={{ bottom: "20%", right: "15%" }}
      />
    </div>

    <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <span className="inline-block px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
          Projeto de Pesquisa e Acolhimento
        </span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
      >
        Observatório da<br />
        <span className="text-emerald-400">Saúde Mental</span> no Futebol
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto"
      >
        Dados, histórias e análises sobre o impacto emocional do futebol na vida dos torcedores
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="flex flex-wrap justify-center gap-4"
      >
        <Button
          size="lg"
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-8"
          onClick={() => document.getElementById("dashboard")?.scrollIntoView({ behavior: "smooth" })}
        >
          <BarChart3 className="w-5 h-5 mr-2" /> Explorar Dados
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="border-white/30 text-white hover:bg-white/10 rounded-full px-8"
          onClick={() => document.getElementById("educativo")?.scrollIntoView({ behavior: "smooth" })}
        >
          <BookOpen className="w-5 h-5 mr-2" /> Entender o Impacto
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="border-emerald-500 text-emerald-400 hover:bg-emerald-500/10 rounded-full px-8"
          onClick={() => document.getElementById("relatos")?.scrollIntoView({ behavior: "smooth" })}
        >
          <Send className="w-5 h-5 mr-2" /> Enviar Relato
        </Button>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <ChevronDown className="w-8 h-8 text-white/50" />
      </motion.div>
    </div>
  </section>
);

/* ===================== INTERACTIVE MAP ===================== */
const brazilRegions: { id: string; name: string; x: number; y: number }[] = [
  { id: "norte", name: "Norte", x: 30, y: 20 },
  { id: "nordeste", name: "Nordeste", x: 75, y: 25 },
  { id: "centro-oeste", name: "Centro-Oeste", x: 40, y: 50 },
  { id: "sudeste", name: "Sudeste", x: 65, y: 65 },
  { id: "sul", name: "Sul", x: 50, y: 85 }
];

const regionData: Record<string, { ansiedade: number; estresse: number; irritabilidade: number; insight: string }> = {
  norte: { ansiedade: 42, estresse: 38, irritabilidade: 25, insight: "Menor densidade de times grandes reduz pressão coletiva." },
  nordeste: { ansiedade: 68, estresse: 72, irritabilidade: 55, insight: "Rivalidades históricas intensas elevam tensão emocional." },
  "centro-oeste": { ansiedade: 45, estresse: 40, irritabilidade: 30, insight: "Crescimento recente de torcidas organizadas." },
  sudeste: { ansiedade: 75, estresse: 78, irritabilidade: 60, insight: "Maiores torcidas do país, alta pressão por resultados." },
  sul: { ansiedade: 65, estresse: 60, irritabilidade: 50, insight: "Forte identificação regional amplifica emoções." }
};

const MapSection = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const data = selected ? regionData[selected] : null;

  return (
    <Section id="mapa" dark>
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Mapa Interativo do Brasil</h2>
      <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
        Clique em uma região para explorar os indicadores de sofrimento psíquico relacionados ao futebol
      </p>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Map */}
        <div className="flex-1 relative bg-gray-800/50 rounded-2xl p-8 min-h-[400px]">
          <svg viewBox="0 0 100 100" className="w-full h-full max-w-md mx-auto">
            {/* Simplified Brazil outline */}
            <path
              d="M20 10 L80 10 L90 30 L85 50 L80 70 L70 90 L40 95 L25 80 L15 50 L20 30 Z"
              fill="none"
              stroke="rgba(16, 185, 129, 0.3)"
              strokeWidth="0.5"
            />
            {brazilRegions.map((region) => (
              <g key={region.id}>
                <motion.circle
                  cx={region.x}
                  cy={region.y}
                  r={selected === region.id ? 8 : 6}
                  fill={selected === region.id ? "#10b981" : "#374151"}
                  stroke="#10b981"
                  strokeWidth={1}
                  className="cursor-pointer"
                  whileHover={{ scale: 1.3 }}
                  onClick={() => setSelected(region.id)}
                />
                <text
                  x={region.x}
                  y={region.y + 14}
                  textAnchor="middle"
                  fontSize="4"
                  fill="#9ca3af"
                  className="pointer-events-none"
                >
                  {region.name}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Data Panel */}
        <div className="flex-1 bg-gray-800 rounded-2xl p-6 min-h-[400px]">
          {data ? (
            <>
              <h3 className="text-xl font-semibold mb-6 text-emerald-400">
                {brazilRegions.find((r) => r.id === selected)?.name}
              </h3>
              <div className="space-y-6">
                {[
                  { label: "Ansiedade", value: data.ansiedade, icon: Brain },
                  { label: "Estresse", value: data.estresse, icon: Activity },
                  { label: "Irritabilidade", value: data.irritabilidade, icon: Zap }
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="flex items-center gap-2 text-gray-300">
                        <item.icon className="w-4 h-4" /> {item.label}
                      </span>
                      <span className="font-bold text-emerald-400">{item.value}%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-emerald-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${item.value}%` }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-gray-700/50 rounded-xl">
                <p className="text-sm text-gray-300">
                  <span className="font-semibold text-white">Insight: </span>
                  {data.insight}
                </p>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <MapPin className="w-12 h-12 mb-4" />
              <p>Selecione uma região no mapa</p>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
};

/* ===================== DASHBOARD ===================== */
const indicators = [
  { label: "Ansiedade", value: 68, color: "bg-red-500", icon: Brain, description: "Preocupação excessiva com resultados e desempenho do time." },
  { label: "Estresse", value: 72, color: "bg-orange-500", icon: Activity, description: "Tensão física e mental antes, durante e após partidas." },
  { label: "Irritabilidade", value: 55, color: "bg-yellow-500", icon: Zap, description: "Reações emocionais intensas a derrotas ou decisões de arbitragem." },
  { label: "Agressividade", value: 35, color: "bg-red-600", icon: Angry, description: "Comportamentos hostis em contextos de rivalidade." },
  { label: "Consumo de Álcool", value: 48, color: "bg-purple-500", icon: Wine, description: "Associação entre consumo de álcool e eventos esportivos." }
];

const DashboardSection = () => {
  const [clubFilter, setClubFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [hoveredIndicator, setHoveredIndicator] = useState<number | null>(null);

  return (
    <Section id="dashboard">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Dashboard de Dados</h2>
      <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto">
        Visualize os indicadores de sofrimento psíquico coletados em nossa pesquisa
      </p>

      {/* Filters */}
      <div className="flex flex-wrap justify-center gap-4 mb-12">
        <Select value={clubFilter} onValueChange={setClubFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por clube" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os clubes</SelectItem>
            {allBrazilianClubs.slice(0, 20).map((club) => (
              <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={regionFilter} onValueChange={setRegionFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por região" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as regiões</SelectItem>
            {brazilRegions.map((r) => (
              <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {indicators.map((ind, i) => (
          <Card
            key={ind.label}
            className="relative overflow-hidden cursor-pointer transition-shadow hover:shadow-lg"
            onMouseEnter={() => setHoveredIndicator(i)}
            onMouseLeave={() => setHoveredIndicator(null)}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${ind.color}/10`}>
                  <ind.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold">{ind.label}</h3>
              </div>

              <div className="relative h-32 flex items-end justify-center">
                <motion.div
                  className={`w-16 ${ind.color} rounded-t-lg`}
                  initial={{ height: 0 }}
                  whileInView={{ height: `${ind.value}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  viewport={{ once: true }}
                />
                <span className="absolute top-0 left-1/2 -translate-x-1/2 text-2xl font-bold">
                  {ind.value}%
                </span>
              </div>

              {/* Tooltip */}
              {hoveredIndicator === i && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute inset-0 bg-gray-900/95 text-white p-4 flex items-center"
                >
                  <p className="text-sm">{ind.description}</p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </Section>
  );
};

/* ===================== TIMELINE ===================== */
const timelineEvents = [
  { year: "2014", title: "7x1 – Mineiraço", description: "Derrota histórica contra a Alemanha gerou luto coletivo e aumento de casos de ansiedade.", impact: "Trauma coletivo nacional" },
  { year: "2019", title: "Libertadores – Flamengo x River", description: "Final emocionante com virada nos minutos finais causou picos de estresse e euforia.", impact: "Bipolaridade emocional" },
  { year: "2021", title: "Rebaixamentos Série A", description: "Torcedores de grandes clubes enfrentaram estresse prolongado com campanhas ruins.", impact: "Depressão e ansiedade" },
  { year: "2022", title: "Copa do Mundo Qatar", description: "Eliminação nas quartas reacendeu debates sobre saúde mental de torcedores.", impact: "Frustração nacional" },
  { year: "2023", title: "Violência em Estádios", description: "Incidentes de violência levantaram questões sobre ambiente esportivo e saúde mental.", impact: "Medo e agressividade" }
];

const TimelineSection = () => {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <Section id="timeline" dark>
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Linha do Tempo</h2>
      <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
        Eventos marcantes do futebol e seus impactos emocionais coletivos
      </p>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-emerald-500/30" />

        <div className="space-y-8">
          {timelineEvents.map((event, i) => (
            <div
              key={event.year}
              className={`relative flex items-start gap-6 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
            >
              {/* Dot */}
              <div className="absolute left-4 md:left-1/2 w-4 h-4 -translate-x-1/2 bg-emerald-500 rounded-full border-4 border-gray-900 z-10" />

              {/* Card */}
              <div className={`ml-12 md:ml-0 md:w-1/2 ${i % 2 === 0 ? "md:pr-12" : "md:pl-12"}`}>
                <Card
                  className="bg-gray-800 border-gray-700 cursor-pointer hover:border-emerald-500/50 transition-colors"
                  onClick={() => setExpanded(expanded === i ? null : i)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-full">
                        {event.year}
                      </span>
                      <Clock className="w-4 h-4 text-gray-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{event.title}</h3>

                    {expanded === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        className="overflow-hidden"
                      >
                        <p className="text-gray-400 text-sm mb-3">{event.description}</p>
                        <div className="flex items-center gap-2 text-emerald-400 text-sm">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Impacto: {event.impact}</span>
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
};

/* ===================== VOZ DO TORCEDOR ===================== */
const testimonials = [
  { text: "Depois de cada derrota do meu time, eu não consigo dormir. A ansiedade toma conta.", emotion: "Ansiedade", icon: Brain },
  { text: "Já perdi amizades por causa de discussões sobre futebol. A rivalidade me consome.", emotion: "Irritabilidade", icon: Angry },
  { text: "Quando meu time foi rebaixado, entrei em depressão. Parecia que tinha perdido algo meu.", emotion: "Tristeza", icon: Frown },
  { text: "Sinto que minha felicidade depende demais dos resultados. Isso não é saudável.", emotion: "Dependência", icon: Heart }
];

const VoicesSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const Icon = testimonials[currentIndex].icon;

  return (
    <Section id="vozes">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Voz do Torcedor</h2>
      <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
        Depoimentos anônimos de torcedores sobre suas experiências emocionais
      </p>

      <div className="max-w-3xl mx-auto">
        <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
          <CardContent className="p-8 md:p-12 text-center">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <MessageCircle className="w-12 h-12 text-emerald-500 mx-auto mb-6" />
              <p className="text-xl md:text-2xl text-gray-800 italic mb-6">
                "{testimonials[currentIndex].text}"
              </p>
              <div className="flex items-center justify-center gap-2">
                <Icon className="w-5 h-5 text-emerald-600" />
                <span className="text-emerald-600 font-medium">{testimonials[currentIndex].emotion}</span>
              </div>
            </motion.div>
          </CardContent>
        </Card>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-3 h-3 rounded-full transition-colors ${i === currentIndex ? "bg-emerald-500" : "bg-gray-300"}`}
            />
          ))}
        </div>
      </div>
    </Section>
  );
};

/* ===================== RELATOS / DENÚNCIAS FORM ===================== */
const emotions = [
  { id: "ansiedade", label: "Ansiedade" },
  { id: "raiva", label: "Raiva" },
  { id: "tristeza", label: "Tristeza" },
  { id: "medo", label: "Medo" },
  { id: "frustração", label: "Frustração" },
  { id: "vergonha", label: "Vergonha" },
  { id: "euforia", label: "Euforia" },
  { id: "outro", label: "Outro" }
];

const ReportSection = () => {
  const { toast } = useToast();
  const [submitType, setSubmitType] = useState<"relato" | "denuncia">("relato");
  const [content, setContent] = useState("");
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [clubId, setClubId] = useState("");
  const [location, setLocation] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleEmotion = (id: string) => {
    setSelectedEmotions((prev) => (prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles].slice(0, 5)); // max 5 files
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Content validation
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      toast({ title: "Erro", description: "Por favor, escreva seu relato ou denúncia.", variant: "destructive" });
      return;
    }
    
    // Content length validation (10KB limit to prevent abuse)
    const MAX_CONTENT_LENGTH = 10000;
    if (trimmedContent.length > MAX_CONTENT_LENGTH) {
      toast({ 
        title: "Erro", 
        description: `O conteúdo excede o limite de ${MAX_CONTENT_LENGTH.toLocaleString()} caracteres. Por favor, resuma seu relato.`, 
        variant: "destructive" 
      });
      return;
    }
    
    // File size validation (5MB per file, 25MB total)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const MAX_TOTAL_SIZE = 25 * 1024 * 1024; // 25MB
    let totalSize = 0;
    
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        toast({ 
          title: "Erro", 
          description: `O arquivo "${file.name}" excede o limite de 5MB.`, 
          variant: "destructive" 
        });
        return;
      }
      totalSize += file.size;
    }
    
    if (totalSize > MAX_TOTAL_SIZE) {
      toast({ 
        title: "Erro", 
        description: "O tamanho total dos arquivos excede 25MB.", 
        variant: "destructive" 
      });
      return;
    }
    
    // Email validation if not anonymous
    if (!isAnonymous && contactEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactEmail)) {
        toast({ title: "Erro", description: "Por favor, insira um email válido.", variant: "destructive" });
        return;
      }
    }

    setSubmitting(true);
    try {
      // Upload files
      const uploadedPaths: string[] = [];
      for (const file of files) {
        const ext = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("osmf-reports").upload(fileName, file);
        if (!uploadError) {
          uploadedPaths.push(fileName);
        }
      }

      // Submit through rate-limited edge function
      const response = await supabase.functions.invoke("submit-osmf-report", {
        body: {
          submit_type: submitType,
          content: trimmedContent,
          emotions: selectedEmotions.slice(0, 10),
          club_id: clubId || null,
          location_text: location ? location.slice(0, 500) : null,
          is_anonymous: isAnonymous,
          contact_name: isAnonymous ? null : (contactName ? contactName.slice(0, 200) : null),
          contact_email: isAnonymous ? null : (contactEmail ? contactEmail.slice(0, 255) : null),
          attachment_paths: uploadedPaths
        }
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao enviar relato");
      }

      // Check for rate limit error in response data
      if (response.data?.error) {
        if (response.data.retryAfter) {
          const minutes = Math.ceil(response.data.retryAfter / 60);
          toast({ 
            title: "Limite de envios", 
            description: `Por favor, aguarde ${minutes} minuto(s) antes de enviar outro relato.`, 
            variant: "destructive" 
          });
        } else {
          throw new Error(response.data.error);
        }
        return;
      }

      setShowSuccess(true);
      // Reset form
      setContent("");
      setSelectedEmotions([]);
      setClubId("");
      setLocation("");
      setContactName("");
      setContactEmail("");
      setFiles([]);
    } catch (error) {
      console.error("Error submitting report:", error);
      const errorMessage = error instanceof Error ? error.message : "Não foi possível enviar. Tente novamente.";
      toast({ title: "Erro", description: errorMessage, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Section id="relatos" dark>
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Relatos e Denúncias do Torcedor</h2>
      <p className="text-gray-400 text-center mb-8 max-w-2xl mx-auto">
        Compartilhe sua experiência de forma segura. Seus dados são protegidos e tratados com ética.
      </p>

      <div className="max-w-2xl mx-auto">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Type */}
              <div>
                <Label className="text-white mb-3 block">Tipo de envio</Label>
                <RadioGroup value={submitType} onValueChange={(v) => setSubmitType(v as "relato" | "denuncia")} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="relato" id="relato" className="border-emerald-500 text-emerald-500" />
                    <Label htmlFor="relato" className="text-gray-300 cursor-pointer">Relato</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="denuncia" id="denuncia" className="border-emerald-500 text-emerald-500" />
                    <Label htmlFor="denuncia" className="text-gray-300 cursor-pointer">Denúncia</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Content */}
              <div>
                <Label htmlFor="content" className="text-white mb-2 block">
                  {submitType === "relato" ? "Seu relato" : "Sua denúncia"} *
                </Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={submitType === "relato" ? "Conte sua experiência emocional com o futebol..." : "Descreva a situação que deseja denunciar..."}
                  className="min-h-[150px] bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>

              {/* Emotions */}
              <div>
                <Label className="text-white mb-3 block">Emoções sentidas (selecione uma ou mais)</Label>
                <div className="flex flex-wrap gap-2">
                  {emotions.map((em) => (
                    <button
                      key={em.id}
                      type="button"
                      onClick={() => toggleEmotion(em.id)}
                      className={`px-4 py-2 rounded-full text-sm transition-colors ${selectedEmotions.includes(em.id) ? "bg-emerald-500 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
                    >
                      {em.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional fields */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="club" className="text-white mb-2 block">Clube relacionado (opcional)</Label>
                  <Select value={clubId} onValueChange={setClubId}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Selecione um clube" />
                    </SelectTrigger>
                    <SelectContent>
                      {allBrazilianClubs.map((club) => (
                        <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="location" className="text-white mb-2 block">Local (opcional)</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex: Estádio, bar, em casa"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>

              {/* File upload */}
              <div>
                <Label className="text-white mb-2 block">Anexos (fotos ou vídeos - opcional)</Label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Upload className="w-4 h-4 mr-2" /> Adicionar arquivos
                </Button>
                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {files.map((file, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-300 bg-gray-700 px-3 py-2 rounded-lg">
                        <span className="truncate flex-1">{file.name}</span>
                        <button type="button" onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-400">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Anonymous toggle */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="anonymous"
                  checked={isAnonymous}
                  onCheckedChange={(v) => setIsAnonymous(!!v)}
                  className="border-gray-600 data-[state=checked]:bg-emerald-500"
                />
                <Label htmlFor="anonymous" className="text-gray-300 cursor-pointer">Enviar anonimamente</Label>
              </div>

              {/* Contact info if not anonymous */}
              {!isAnonymous && (
                <div className="grid md:grid-cols-2 gap-4 p-4 bg-gray-700/50 rounded-lg">
                  <div>
                    <Label htmlFor="name" className="text-white mb-2 block">Seu nome</Label>
                    <Input
                      id="name"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-white mb-2 block">Seu e-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
              )}

              {/* Privacy notice */}
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-emerald-400 mt-0.5" />
                  <p className="text-sm text-gray-300">
                    <strong className="text-emerald-400">Aviso de privacidade:</strong> Seus dados são tratados conforme a LGPD. Relatos anônimos não são vinculados a identidades. Suas informações são usadas apenas para pesquisa e melhoria de políticas de saúde mental no esporte.
                  </p>
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {submitting ? "Enviando..." : "Enviar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Success dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-400">
              <Check className="w-6 h-6" /> Enviado com sucesso!
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Obrigado por compartilhar sua experiência. Seu relato é muito importante para nossa pesquisa.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setShowSuccess(false)} className="bg-emerald-600 hover:bg-emerald-700">
            Fechar
          </Button>
        </DialogContent>
      </Dialog>
    </Section>
  );
};

/* ===================== EDUCATIONAL CONTENT ===================== */
const educationalCards = [
  {
    title: "Futebol, Identidade e Pertencimento",
    description: "Entenda por que o futebol é tão importante para a identidade brasileira",
    content: "O futebol no Brasil vai além do esporte – é parte da construção da identidade nacional e individual. A sensação de pertencer a uma torcida cria vínculos sociais fortes, mas também pode gerar dependência emocional excessiva dos resultados."
  },
  {
    title: "Quando a Paixão Vira Sofrimento",
    description: "Reconheça os sinais de que o futebol está afetando sua saúde mental",
    content: "Alterações de humor intensas, insônia após jogos, irritabilidade excessiva, conflitos familiares e consumo de álcool são sinais de alerta. Se você se identifica, é hora de buscar equilíbrio e, se necessário, ajuda profissional."
  },
  {
    title: "Como Buscar Ajuda",
    description: "Saiba onde encontrar apoio profissional",
    content: "O CVV (188) oferece apoio emocional 24h. Os CAPS (Centros de Atenção Psicossocial) oferecem atendimento gratuito. Psicólogos e psiquiatras particulares também podem ajudar. Não tenha vergonha de pedir ajuda – cuidar da mente é tão importante quanto cuidar do corpo."
  }
];

const EducationalSection = () => {
  const [openCard, setOpenCard] = useState<number | null>(null);

  return (
    <Section id="educativo">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Conteúdo Educativo</h2>
      <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
        Informações para entender melhor a relação entre futebol e saúde mental
      </p>

      <div className="grid md:grid-cols-3 gap-6">
        {educationalCards.map((card, i) => (
          <Card
            key={i}
            className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
            onClick={() => setOpenCard(i)}
          >
            <CardContent className="p-6">
              <BookOpen className="w-10 h-10 text-emerald-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{card.description}</p>
              <span className="text-emerald-600 text-sm font-medium flex items-center gap-1">
                Saiba mais <ChevronRight className="w-4 h-4" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal */}
      <Dialog open={openCard !== null} onOpenChange={() => setOpenCard(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{openCard !== null && educationalCards[openCard].title}</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">{openCard !== null && educationalCards[openCard].content}</p>
        </DialogContent>
      </Dialog>
    </Section>
  );
};

/* ===================== METHODOLOGY ===================== */
const MethodologySection = () => (
  <Section id="metodologia" dark>
    <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Transparência e Metodologia</h2>
    <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
      Como coletamos, tratamos e utilizamos os dados
    </p>

    <div className="grid md:grid-cols-3 gap-8">
      {[
        {
          icon: MessageCircle,
          title: "Coleta de Dados",
          description: "Os dados são coletados através de formulários anônimos, pesquisas estruturadas e parcerias com universidades e instituições de saúde."
        },
        {
          icon: Shield,
          title: "Proteção e LGPD",
          description: "Todos os dados são anonimizados e tratados conforme a Lei Geral de Proteção de Dados. Não compartilhamos informações pessoais com terceiros."
        },
        {
          icon: BarChart3,
          title: "Uso dos Dados",
          description: "Os dados são utilizados exclusivamente para pesquisa, geração de insights e criação de políticas públicas de saúde mental no esporte."
        }
      ].map((item, i) => (
        <Card key={i} className="bg-gray-800 border-gray-700">
          <CardContent className="p-6 text-center">
            <item.icon className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-3">{item.title}</h3>
            <p className="text-gray-400 text-sm">{item.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  </Section>
);

/* ===================== MAIN PAGE ===================== */
const OSMF = () => {
  return (
    <div className="min-h-screen bg-white">
      <DesktopHeader />
      <main className="pt-[72px]">
        <HeroSection />
        <MapSection />
        <DashboardSection />
        <TimelineSection />
        <VoicesSection />
        <ReportSection />
        <EducationalSection />
        <MethodologySection />
      </main>
      <DesktopFooter />
    </div>
  );
};

export default OSMF;
