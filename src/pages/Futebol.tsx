import { useState } from "react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import NewsList from "@/components/futebol/NewsList";

const categories = ["Todos", "Futebol", "Brasileiro", "Libertadores", "Sul-Americana", "Seleção"];

const Futebol = () => {
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Header />

      <main className="pt-20">
        {/* Header */}
        <div className="px-4 mb-6">
          <h1 className="font-display text-4xl text-black mb-2">
            Notícias
          </h1>
          <p className="text-gray-600">
            Tudo sobre futebol brasileiro e sul-americano
          </p>
        </div>

        {/* Categories */}
        <div className="px-4 mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-white border border-gray-200 text-gray-800 hover:border-primary"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* News List */}
        <NewsList selectedCategory={selectedCategory} />

        {/* Spacer para manter distância do BottomNav */}
        <div aria-hidden className="h-28" />
      </main>

      <BottomNav />
    </div>
  );
};

export default Futebol;
