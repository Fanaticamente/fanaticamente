import { ProductCategory, categoryLabels } from "@/data/shopProducts";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex px-4">
          <button
            onClick={() => onSelectCategory(null)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 border-b-2 transition-colors",
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
                "flex items-center gap-2 px-4 py-3 border-b-2 transition-colors",
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
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default CategoryTabs;
