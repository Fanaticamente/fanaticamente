import { useState, useMemo } from "react";
import BottomNav from "@/components/layout/BottomNav";
import ShopHeader from "@/components/shop/ShopHeader";
import ClubFilter from "@/components/shop/ClubFilter";
import CategoryTabs from "@/components/shop/CategoryTabs";
import ProductGrid from "@/components/shop/ProductGrid";
import FeaturedBanner from "@/components/shop/FeaturedBanner";
import HorizontalProductList from "@/components/shop/HorizontalProductList";
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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20">
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
          <div className="space-y-6">
            <div className="pt-4">
              <FeaturedBanner onSelectClub={handleSelectClub} />
            </div>

            <HorizontalProductList title="🔥 Destaques" products={featuredProducts} />
            <HorizontalProductList title="🆕 Novidades" products={newProducts} />
            <HorizontalProductList
              title="💰 Ofertas Imperdíveis"
              products={discountedProducts}
            />

            <ProductGrid products={allProducts.slice(0, 20)} title="Todos os Produtos" />
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default FanaticaShop;
