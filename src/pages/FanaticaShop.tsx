import { useState, useMemo } from "react";
import Header from "@/components/layout/Header";
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
      {/* Shop Header with Search */}
      <ShopHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Club Filter - Fixed position with scroll */}
      <ClubFilter selectedClub={selectedClub} onSelectClub={handleSelectClub} />

      {/* Category Tabs */}
      <CategoryTabs
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Content */}
      {isSearching || hasFilters ? (
        /* Filtered Results */
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
        /* Home Content */
        <div className="space-y-6">
          {/* Featured Banner */}
          <div className="pt-4">
            <FeaturedBanner onSelectClub={handleSelectClub} />
          </div>

          {/* Featured Products */}
          <HorizontalProductList
            title="🔥 Destaques"
            products={featuredProducts}
          />

          {/* New Products */}
          <HorizontalProductList
            title="🆕 Novidades"
            products={newProducts}
          />

          {/* Discounted Products */}
          <HorizontalProductList
            title="💰 Ofertas Imperdíveis"
            products={discountedProducts}
          />

          {/* All Products */}
          <ProductGrid products={allProducts.slice(0, 20)} title="Todos os Produtos" />
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default FanaticaShop;
