import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Terapeutas from "./pages/Terapeutas";
import Cursos from "./pages/Cursos";
import CursoDetalhe from "./pages/CursoDetalhe";
import Quiz from "./pages/Quiz";
import Diario from "./pages/Diario";
import Radio from "./pages/Radio";
import Futebol from "./pages/Futebol";
import Perfil from "./pages/Perfil";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/terapeutas" element={<Terapeutas />} />
          <Route path="/cursos" element={<Cursos />} />
          <Route path="/curso/:id" element={<CursoDetalhe />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/diario" element={<Diario />} />
          <Route path="/radio" element={<Radio />} />
          <Route path="/futebol" element={<Futebol />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
