import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProductById, getProductStoreUrl } from "@/data/shopProducts";
import { getClubById } from "@/data/brazilianClubs";
import ShopHeader from "@/components/shop/ShopHeader";
import BottomNav from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ExternalLink,
  Heart,
  Truck,
  Shield,
  Store,
  ChevronLeft,
  Info,
  BadgeCheck,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const product = id ? getProductById(id) : undefined;
  const club = product ? getClubById(product.clubId) : undefined;

  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    product?.sizes?.[0]
  );
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    product?.colors?.[0]
  );
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

  const handleBuyNow = () => {
    const storeUrl = getProductStoreUrl(product);
    window.open(storeUrl, "_blank", "noopener,noreferrer");
    toast.success(`Redirecionando para a loja oficial do ${club?.name}...`);
  };

  const handleVisitStore = () => {
    if (club) {
      window.open(club.storeUrl, "_blank", "noopener,noreferrer");
      toast.success(`Abrindo a loja oficial do ${club.name}...`);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 pb-20">
      <ShopHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showBack
      />

      <div className="container max-w-4xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="space-y-4">
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-zinc-800">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.source === "official_store" && (
                  <Badge className="bg-blue-600 text-white flex items-center gap-1">
                    <BadgeCheck className="w-3 h-3" />
                    Produto Oficial
                  </Badge>
                )}
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
                <div className="absolute top-4 right-4 bg-zinc-800 rounded-full p-2">
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
                className="absolute bottom-4 right-4 bg-zinc-800/90 hover:bg-zinc-700 border-zinc-600 text-white"
              >
                <Heart className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Info Section */}
          <div className="space-y-6">
            {/* Club Name */}
            {club && (
              <p className="text-sm text-green-400 font-medium">{club.name}</p>
            )}

            {/* Product Name */}
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {product.name}
            </h1>

            {/* Price */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-3">
                {product.originalPrice && (
                  <span className="text-lg text-zinc-500 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
                <span className="text-3xl font-bold text-white">
                  {formatPrice(product.price)}
                </span>
              </div>
              {product.source === "official_store" ? (
                <p className="text-sm text-green-400 font-medium flex items-center gap-1">
                  <BadgeCheck className="w-4 h-4" />
                  Preço atualizado da loja oficial
                </p>
              ) : (
                <p className="text-sm text-zinc-400">
                  Preço de referência - confira o valor atualizado na loja oficial
                </p>
              )}
            </div>

            {/* Size Reference */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-100">
                  Tamanhos disponíveis
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <span
                      key={size}
                      className="px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-sm font-medium text-zinc-200"
                    >
                      {size}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Color Reference */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-100">
                  Cores disponíveis
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <span
                      key={color}
                      className="px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-sm font-medium text-zinc-200"
                    >
                      {color}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Info Notice */}
            {product.source === "official_store" ? (
              <div className="bg-green-950/30 border border-green-800 rounded-lg p-4 flex gap-3">
                <BadgeCheck className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-green-400 mb-1">
                    Produto da Loja Oficial
                  </p>
                  <p className="text-green-300/80">
                    Este produto foi verificado diretamente na loja oficial do {club?.name}. 
                    Ao clicar em "Comprar", você será redirecionado para a página exata do produto.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 flex gap-3">
                <Info className="w-5 h-5 text-zinc-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-zinc-400">
                  <p className="font-medium text-zinc-200 mb-1">
                    Vitrine de Produtos
                  </p>
                  <p>
                    Este é um catálogo de referência. Ao clicar em "Comprar na Loja Oficial", 
                    você será redirecionado para a loja oficial do {club?.name} onde poderá 
                    finalizar sua compra com segurança.
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <Button className="w-full bg-white text-zinc-900 hover:bg-zinc-200" size="lg" onClick={handleBuyNow}>
                <ExternalLink className="w-5 h-5 mr-2" />
                Comprar na Loja Oficial
              </Button>
              <Button
                variant="outline"
                className="w-full border-zinc-600 text-zinc-200 hover:bg-zinc-800"
                size="lg"
                onClick={handleVisitStore}
              >
                <Store className="w-5 h-5 mr-2" />
                Visitar Loja do {club?.name}
              </Button>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-zinc-700">
              <div className="flex flex-col items-center text-center gap-2">
                <Shield className="w-6 h-6 text-zinc-300" />
                <span className="text-xs text-zinc-400">
                  Loja Oficial
                </span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <Truck className="w-6 h-6 text-zinc-300" />
                <span className="text-xs text-zinc-400">
                  Entrega pela Loja
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="pt-6 border-t border-zinc-700">
              <h3 className="font-medium text-zinc-100 mb-2">Descrição</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {product.description}
              </p>
            </div>
          </div>
        </div>

        {/* Spacer para manter distância do BottomNav */}
        <div aria-hidden className="h-[calc(6.5rem+env(safe-area-inset-bottom))]" />
      </div>

      <BottomNav />
    </div>
  );
};

export default ProductDetail;
