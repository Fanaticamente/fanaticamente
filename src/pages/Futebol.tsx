import { useState } from "react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import NewsList from "@/components/futebol/NewsList";
import ClubFilterDropdown from "@/components/futebol/ClubFilterDropdown";
import { brazilianClubs } from "@/data/brazilianClubs";

const categories = ["Todos", "Futebol", "Brasileiro", "Libertadores", "Sul-Americana", "Seleção"];

const Futebol = () => {
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedClub, setSelectedClub] = useState<string | null>(null);

  const selectedClubData = selectedClub
    ? brazilianClubs.find((c) => c.id === selectedClub)
    : null;

  const clubPrimary = selectedClubData?.primaryColor;
  const clubSecondary = selectedClubData?.secondaryColor;

  // Determine if club primary is too dark for text on white
  const isClubDark = clubPrimary && ["#000000", "#000"].includes(clubPrimary.toUpperCase());
  const accentColor = isClubDark && clubSecondary && clubSecondary !== "#FFFFFF" && clubSecondary !== "#000000"
    ? clubSecondary
    : clubPrimary;

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{
        backgroundColor: selectedClub ? "#f5f5f5" : "white",
      }}
    >
      <Header />

      <main className="pt-20">
        {/* Header */}
        <div className="px-4 mb-6">
          <div
            className="flex items-center justify-between pb-3 mb-3 border-b-2 transition-colors duration-300"
            style={{
              borderColor: selectedClub && accentColor ? accentColor : "#1f2937",
            }}
          >
            {selectedClubData ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden border border-gray-200 shadow-sm">
                  <img
                    src={selectedClubData.badgeUrl}
                    alt={selectedClubData.name}
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <div>
                  <h1
                    className="text-3xl font-display font-bold italic uppercase tracking-tight transition-colors duration-300"
                    style={{ color: accentColor || "#1f2937" }}
                  >
                    {selectedClubData.name}
                  </h1>
                </div>
              </div>
            ) : (
              <h1 className="text-4xl font-display font-bold text-gray-800 tracking-tight">
                Notícias
              </h1>
            )}
            <ClubFilterDropdown
              selectedClub={selectedClub}
              onSelectClub={setSelectedClub}
            />
          </div>
          <p className="text-gray-600 text-sm tracking-wide font-sans">
            {selectedClubData
              ? `Últimas notícias sobre o ${selectedClubData.name}`
              : "Tudo sobre futebol brasileiro e sul-americano"}
          </p>
        </div>

        {/* Categories */}
        <div className="px-4 mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors"
                style={
                  selectedCategory === cat
                    ? {
                        backgroundColor: accentColor || "hsl(var(--primary))",
                        color: "#FFFFFF",
                      }
                    : {
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        color: "#1f2937",
                      }
                }
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* News List */}
        <NewsList selectedCategory={selectedCategory} selectedClub={selectedClub} />

        {/* Spacer para manter distância do BottomNav */}
        <div aria-hidden className="h-28" />
      </main>

      <BottomNav />
    </div>
  );
};

export default Futebol;
