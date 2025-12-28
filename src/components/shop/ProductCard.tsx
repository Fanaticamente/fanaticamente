import { Product, getProductStoreUrl } from "@/data/shopProducts";
import { getClubById } from "@/data/brazilianClubs";
import { ExternalLink, Heart, BadgeCheck } from "lucide-react";
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
      className="group bg-card rounded-xl overflow-hidden border border-border/50 hover:border-primary/50 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 h-full flex flex-col"
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-muted flex-shrink-0">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.source === "official_store" && (
            <Badge className="bg-blue-600 text-white text-xs flex items-center gap-1">
              <BadgeCheck className="w-3 h-3" />
              Oficial
            </Badge>
          )}
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
              className="w-7 h-7 object-contain drop-shadow-lg"
            />
          </div>
        )}

        {/* Quick Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            size="sm"
            className="w-full bg-primary hover:bg-primary/90 text-xs"
            onClick={handleBuyClick}
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Ver na Loja
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="p-2 flex flex-col flex-1">
        <h3 className="font-medium text-xs text-foreground line-clamp-2 min-h-[32px] leading-tight">
          {product.name}
        </h3>
        
        <div className="mt-auto pt-2">
          <div className="flex items-baseline gap-1 flex-wrap">
            {product.originalPrice && (
              <span className="text-[10px] text-muted-foreground line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
            <span className="text-sm font-bold text-primary">
              {formatPrice(product.price)}
            </span>
          </div>
          
          {product.source === "official_store" ? (
            <p className="text-[10px] text-blue-600 font-medium mt-1 flex items-center gap-1 truncate">
              <BadgeCheck className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">Loja Oficial</span>
            </p>
          ) : (
            <p className="text-[10px] text-muted-foreground mt-1 truncate">
              Preço de referência
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
