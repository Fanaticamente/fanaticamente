import { ProductCategory, categoryLabels } from "@/data/shopProducts";
import { cn } from "@/lib/utils";
import { Shirt, Wind, Dumbbell, Watch, Footprints, Baby } from "lucide-react";

interface CategoryTabsProps {
  selectedCategory: ProductCategory | null;
  onSelectCategory: (category: ProductCategory | null) => void;
}

const categoryIcons: Record<ProductCategory, React.ReactNode> = {
  camisa: <Shirt className="w-4 h-4" />,
  agasalho: <Wind className="w-4 h-4" />,
  shorts: <Dumbbell className="w-4 h-4" />,
  acessorio: <Watch className="w-4 h-4" />,
  calcado: <Footprints className="w-4 h-4" />,
  infantil: <Baby className="w-4 h-4" />,
};

const CategoryTabs = ({ selectedCategory, onSelectCategory }: CategoryTabsProps) => {
  const categories = Object.keys(categoryLabels) as ProductCategory[];

  return (
    <div className="border-b border-zinc-800 bg-zinc-900">
      <div
        className={cn(
          "h-[48px] w-full overflow-x-auto overflow-y-hidden",
          "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        )}
      >
        <div className="flex px-4 h-full items-center">
          <button
            onClick={() => onSelectCategory(null)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap",
              selectedCategory === null
                ? "border-white text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            )}
          >
            Todos
          </button>

          {categories.map((category) => (
            <button
              key={category}
              onClick={() => onSelectCategory(category)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap",
                selectedCategory === category
                  ? "border-white text-white"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              )}
            >
              {categoryIcons[category]}
              {categoryLabels[category]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryTabs;
