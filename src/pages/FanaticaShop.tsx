import { useState, useMemo } from "react";
import BottomNav from "@/components/layout/BottomNav";
import ShopHeader from "@/components/shop/ShopHeader";
import ClubFilter from "@/components/shop/ClubFilter";
import CategoryTabs from "@/components/shop/CategoryTabs";
import ProductGrid from "@/components/shop/ProductGrid";
import FeaturedBanner from "@/components/shop/FeaturedBanner";
import HorizontalProductList from "@/components/shop/HorizontalProductList";
import UserDesktopLayout from "@/components/layout/UserDesktopLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  allProducts,
  ProductCategory,
  getFeaturedProducts,
  getNewProducts,
  getDiscountedProducts,
  searchProducts,
} from "@/data/shopProducts";

const FanaticaShop = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClub, setSelectedClub] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const isMobile = useIsMobile();

  const isSearching = searchQuery.length > 0;
  const hasFilters = selectedClub !== null || selectedCategory !== null;

  const filteredProducts = useMemo(() => {
    let products = allProducts;

    if (searchQuery) {
      products = searchProducts(searchQuery);
    }

    if (selectedClub) {
      products = products.filter((p) => p.clubId === selectedClub);
    }

    if (selectedCategory) {
      products = products.filter((p) => p.category === selectedCategory);
    }

    return products;
  }, [searchQuery, selectedClub, selectedCategory]);

  const featuredProducts = useMemo(() => getFeaturedProducts(), []);
  const newProducts = useMemo(() => getNewProducts(), []);
  const discountedProducts = useMemo(() => getDiscountedProducts(), []);

  const handleSelectClub = (clubId: string | null) => {
    setSelectedClub(clubId);
    setSearchQuery("");
  };

  const ShopContent = () => (
    <div className="space-y-6">
      {/* Filters for desktop */}
      {!isMobile && (
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <ClubFilter selectedClub={selectedClub} onSelectClub={handleSelectClub} />
          <CategoryTabs
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>
      )}

      {isSearching || hasFilters ? (
        <ProductGrid
          products={filteredProducts}
          title={
            isSearching
              ? `Resultados para "${searchQuery}"`
              : selectedClub
              ? "Produtos do time"
              : selectedCategory
              ? "Produtos da categoria"
              : undefined
          }
        />
      ) : (
        <>
          <div className={isMobile ? "pt-4" : ""}>
            <FeaturedBanner onSelectClub={handleSelectClub} />
          </div>

          <HorizontalProductList title="🔥 Destaques" products={featuredProducts} />
          <HorizontalProductList title="🆕 Novidades" products={newProducts} />
          <HorizontalProductList
            title="💰 Ofertas Imperdíveis"
            products={discountedProducts}
          />

          <ProductGrid products={allProducts.slice(0, 20)} title="Todos os Produtos" />
        </>
      )}
    </div>
  );

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        {/* Fixed header stack */}
        <div className="fixed top-0 left-0 right-0 z-50">
          <ShopHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />
          <ClubFilter selectedClub={selectedClub} onSelectClub={handleSelectClub} />
          <CategoryTabs
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>

        {/* Content */}
        <div className="pt-[176px]">
          <ShopContent />
          {/* Spacer para manter distância do BottomNav */}
          <div aria-hidden className="h-28" />
        </div>

        <BottomNav />
      </div>
    );
  }

  // Desktop Layout
  return (
    <UserDesktopLayout title="FanaticaShop" subtitle="Produtos oficiais do seu time do coração">
      <div className="bg-zinc-950 text-zinc-100 rounded-2xl p-6 -mx-2">
        <ShopContent />
      </div>
    </UserDesktopLayout>
  );
};

export default FanaticaShop;
