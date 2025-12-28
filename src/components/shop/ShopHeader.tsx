import { Search, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import CartSheet from "./CartSheet";
import { useNavigate } from "react-router-dom";

interface ShopHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showBack?: boolean;
}

const ShopHeader = ({ searchQuery, onSearchChange, showBack }: ShopHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 glass-dark">
      <div className="container py-3">
        <div className="flex items-center gap-3">
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos, times..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-muted/50 border-border/50"
            />
          </div>

          <CartSheet />
        </div>
      </div>
    </header>
  );
};

export default ShopHeader;
