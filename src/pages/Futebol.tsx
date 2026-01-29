import { useState } from "react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import NewsList from "@/components/futebol/NewsList";

const categories = ["Todos", "Futebol", "Brasileiro", "Libertadores", "Sul-Americana", "Seleção"];

const Futebol = () => {
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-20">
        {/* Header */}
        <div className="px-4 mb-6">
          <div className="border-b-2 border-gray-800 pb-3 mb-3">
            <h1 className="text-4xl font-display font-bold text-gray-900 tracking-tight">
              Notícias
            </h1>
          </div>
          <p className="text-gray-600 text-sm tracking-wide uppercase font-sans">
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
