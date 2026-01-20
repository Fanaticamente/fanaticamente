import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { allBrazilianClubs } from "@/data/allBrazilianClubs";

const DesktopProfessionalForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    profession: "psychologist",
    club: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success("Cadastro enviado com sucesso! Entraremos em contato em breve.");
    setFormData({
      name: "",
      email: "",
      phone: "",
      profession: "psychologist",
      club: "",
    });
    setIsSubmitting(false);
  };

  return (
    <section className="bg-[#0a0a0a] py-20">
      <div className="max-w-2xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <p className="text-emerald-500 uppercase tracking-widest text-sm mb-4">
            Profissionais
          </p>
          <h2 className="font-display text-4xl lg:text-5xl text-white mb-4">
            Faça parte da nossa equipe
          </h2>
          <p className="text-gray-400">
            Cadastre-se e ajude torcedores a cuidarem da saúde mental
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white">Nome completo</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Seu nome completo"
              required
              className="bg-[#1a1a1a] border-gray-700 text-white placeholder:text-gray-500 focus:border-emerald-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="seu@email.com"
              required
              className="bg-[#1a1a1a] border-gray-700 text-white placeholder:text-gray-500 focus:border-emerald-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-white">Telefone com WhatsApp</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="(00) 00000-0000"
              required
              className="bg-[#1a1a1a] border-gray-700 text-white placeholder:text-gray-500 focus:border-emerald-500"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white">Profissão</Label>
            <Select
              value={formData.profession}
              onValueChange={(value) => setFormData(prev => ({ ...prev, profession: value }))}
            >
              <SelectTrigger className="bg-[#1a1a1a] border-gray-700 text-white">
                <SelectValue placeholder="Selecione sua profissão" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-gray-700">
                <SelectItem value="psychologist" className="text-white hover:bg-gray-700">Psicólogo(a)</SelectItem>
                <SelectItem value="psychiatrist" className="text-white hover:bg-gray-700">Psiquiatra</SelectItem>
                <SelectItem value="therapist" className="text-white hover:bg-gray-700">Terapeuta</SelectItem>
                <SelectItem value="other" className="text-white hover:bg-gray-700">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Clube do coração</Label>
            <Select
              value={formData.club}
              onValueChange={(value) => setFormData(prev => ({ ...prev, club: value }))}
            >
              <SelectTrigger className="bg-[#1a1a1a] border-gray-700 text-white">
                <SelectValue placeholder="Selecione seu clube" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-gray-700 max-h-60">
                {allBrazilianClubs.map((club) => (
                  <SelectItem 
                    key={club.id} 
                    value={club.id}
                    className="text-white hover:bg-gray-700"
                  >
                    {club.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 text-lg font-semibold rounded-xl"
          >
            {isSubmitting ? "Enviando..." : "Enviar cadastro"}
          </Button>
        </form>
      </div>
    </section>
  );
};

export default DesktopProfessionalForm;
