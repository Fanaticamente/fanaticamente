import { Product } from "@/data/shopProducts";
import ProductCard from "./ProductCard";
import { PackageX } from "lucide-react";

interface ProductGridProps {
  products: Product[];
  title?: string;
}

const ProductGrid = ({ products, title }: ProductGridProps) => {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
        <PackageX className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg font-medium">Nenhum produto encontrado</p>
        <p className="text-sm">Tente ajustar os filtros de busca</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      {title && (
        <h2 className="text-lg font-bold mb-4 text-zinc-100">{title}</h2>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default ProductGrid;
