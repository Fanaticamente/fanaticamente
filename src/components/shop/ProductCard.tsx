import { Product, getProductStoreUrl } from "@/data/shopProducts";
import { getClubById } from "@/data/brazilianClubs";
import { ExternalLink, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const navigate = useNavigate();
  const club = getClubById(product.clubId);

  const handleBuyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const storeUrl = getProductStoreUrl(product);
    window.open(storeUrl, "_blank", "noopener,noreferrer");
    toast.success(`Redirecionando para a loja oficial do ${club?.name}...`);
  };

  const handleClick = () => {
    navigate(`/loja/produto/${product.id}`);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  return (
    <div
      onClick={handleClick}
      className="group bg-card rounded-xl overflow-hidden border border-border/50 hover:border-primary/50 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1"
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.isNew && (
            <Badge className="bg-green-500 text-white text-xs">Novo</Badge>
          )}
          {product.discount && (
            <Badge className="bg-red-500 text-white text-xs">
              -{product.discount}%
            </Badge>
          )}
        </div>

        {/* Club Badge */}
        {club && (
          <div className="absolute top-2 right-2">
            <img
              src={club.badgeUrl}
              alt={club.name}
              className="w-8 h-8 object-contain drop-shadow-lg"
            />
          </div>
        )}

        {/* Quick Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={handleBuyClick}
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Ver na Loja Oficial
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-white/10 border-white/20 hover:bg-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <Heart className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-medium text-sm text-foreground line-clamp-2 min-h-[40px]">
          {product.name}
        </h3>
        
        <div className="mt-2 flex items-center gap-2">
          {product.originalPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
          <span className="text-lg font-bold text-primary">
            {formatPrice(product.price)}
          </span>
        </div>
        
        <p className="text-xs text-muted-foreground mt-1">
          Preço de referência
        </p>
      </div>
    </div>
  );
};

export default ProductCard;
