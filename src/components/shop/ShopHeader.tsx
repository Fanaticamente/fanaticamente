import { Search, ArrowLeft, Store } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ShopHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showBack?: boolean;
}

const ShopHeader = ({ searchQuery, onSearchChange, showBack }: ShopHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-zinc-900 border-b border-zinc-800">
      <div className="container py-3">
        <div className="flex items-center gap-3">
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0 text-zinc-100 hover:bg-zinc-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          
          {!showBack && (
            <div className="flex items-center gap-2 shrink-0">
              <Store className="w-6 h-6 text-white" />
              <span className="font-bold text-lg text-white">FanaticaShop</span>
            </div>
          )}
          
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              placeholder="Buscar produtos, times..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default ShopHeader;
