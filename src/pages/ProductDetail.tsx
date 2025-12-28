import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProductById } from "@/data/shopProducts";
import { getClubById } from "@/data/brazilianClubs";
import { useCart } from "@/contexts/CartContext";
import ShopHeader from "@/components/shop/ShopHeader";
import BottomNav from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  Heart,
  Truck,
  Shield,
  RotateCcw,
  ChevronLeft,
  Plus,
  Minus,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const product = id ? getProductById(id) : undefined;
  const club = product ? getClubById(product.clubId) : undefined;

  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    product?.sizes?.[0]
  );
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    product?.colors?.[0]
  );
  const [quantity, setQuantity] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium">Produto não encontrado</p>
          <Button onClick={() => navigate("/loja")} className="mt-4">
            Voltar para a loja
          </Button>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return price.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product, selectedSize, selectedColor);
    }
    toast.success(`${quantity}x ${product.name} adicionado ao carrinho!`);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    toast.success("Redirecionando para o checkout...");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <ShopHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showBack
      />

      <div className="container max-w-4xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="space-y-4">
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-muted">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.isNew && (
                  <Badge className="bg-green-500 text-white">Novo</Badge>
                )}
                {product.discount && (
                  <Badge className="bg-red-500 text-white">
                    -{product.discount}%
                  </Badge>
                )}
              </div>

              {/* Club Badge */}
              {club && (
                <div className="absolute top-4 right-4 bg-white rounded-full p-2">
                  <img
                    src={club.badgeUrl}
                    alt={club.name}
                    className="w-10 h-10 object-contain"
                  />
                </div>
              )}

              {/* Wishlist Button */}
              <Button
                variant="outline"
                size="icon"
                className="absolute bottom-4 right-4 bg-white/90 hover:bg-white"
              >
                <Heart className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Info Section */}
          <div className="space-y-6">
            {/* Club Name */}
            {club && (
              <p className="text-sm text-primary font-medium">{club.name}</p>
            )}

            {/* Product Name */}
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {product.name}
            </h1>

            {/* Price */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-3">
                {product.originalPrice && (
                  <span className="text-lg text-muted-foreground line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
                <span className="text-3xl font-bold text-primary">
                  {formatPrice(product.price)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                ou 10x de {formatPrice(product.price / 10)} sem juros
              </p>
            </div>

            {/* Size Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">
                  Tamanho
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                        selectedSize === size
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background hover:border-primary"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">
                  Cor
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                        selectedColor === color
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background hover:border-primary"
                      )}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Quantidade
              </label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <Button className="w-full" size="lg" onClick={handleBuyNow}>
                Comprar Agora
              </Button>
              <Button
                variant="outline"
                className="w-full"
                size="lg"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Adicionar ao Carrinho
              </Button>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
              <div className="flex flex-col items-center text-center gap-2">
                <Truck className="w-6 h-6 text-primary" />
                <span className="text-xs text-muted-foreground">
                  Frete Grátis
                </span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                <span className="text-xs text-muted-foreground">
                  Compra Segura
                </span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <RotateCcw className="w-6 h-6 text-primary" />
                <span className="text-xs text-muted-foreground">
                  Troca Fácil
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="pt-6 border-t border-border">
              <h3 className="font-medium text-foreground mb-2">Descrição</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default ProductDetail;
