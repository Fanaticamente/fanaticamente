import { Product } from "@/data/shopProducts";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import ProductCard from "./ProductCard";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HorizontalProductListProps {
  title: string;
  products: Product[];
  onSeeAll?: () => void;
}

const HorizontalProductList = ({
  title,
  products,
  onSeeAll,
}: HorizontalProductListProps) => {
  if (products.length === 0) return null;

  return (
    <div className="py-4">
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        {onSeeAll && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSeeAll}
            className="text-primary"
          >
            Ver todos
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-3 px-4 pb-2">
          {products.slice(0, 10).map((product) => (
            <div key={product.id} className="w-[140px] shrink-0">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default HorizontalProductList;
