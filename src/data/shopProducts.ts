import { brazilianClubs, BrazilianClub, getClubById } from "./brazilianClubs";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  category: "camisa" | "agasalho" | "shorts" | "acessorio" | "calcado" | "infantil";
  clubId: string;
  sizes?: string[];
  colors?: string[];
  inStock: boolean;
  featured?: boolean;
  isNew?: boolean;
  discount?: number;
}

export type ProductCategory = Product["category"];

export const categoryLabels: Record<ProductCategory, string> = {
  camisa: "Camisas",
  agasalho: "Agasalhos",
  shorts: "Shorts",
  acessorio: "Acessórios",
  calcado: "Calçados",
  infantil: "Infantil",
};

// Helper function to get the external store URL for a product
export const getProductStoreUrl = (product: Product): string => {
  const club = getClubById(product.clubId);
  if (club) {
    // Create a search query based on product name
    const searchQuery = encodeURIComponent(product.name);
    // Most stores support search via query parameter
    return `${club.storeUrl}/busca?q=${searchQuery}`;
  }
  return "#";
};

// Generate products for each Serie A club
const generateClubProducts = (club: BrazilianClub): Product[] => {
  const baseProducts: Omit<Product, "id" | "clubId">[] = [
    {
      name: `Camisa ${club.name} I 2024`,
      description: `Camisa oficial do ${club.name} para a temporada 2024. Material de alta qualidade com tecnologia de absorção de suor.`,
      price: 299.90,
      originalPrice: 349.90,
      imageUrl: `https://placehold.co/400x500/${club.primaryColor.replace("#", "")}/${club.secondaryColor.replace("#", "")}?text=${club.shortName}+I`,
      category: "camisa",
      sizes: ["P", "M", "G", "GG", "XGG"],
      colors: ["Principal"],
      inStock: true,
      featured: true,
      discount: 14,
    },
    {
      name: `Camisa ${club.name} II 2024`,
      description: `Camisa reserva do ${club.name} para a temporada 2024. Design exclusivo e confortável.`,
      price: 279.90,
      imageUrl: `https://placehold.co/400x500/${club.secondaryColor.replace("#", "")}/${club.primaryColor.replace("#", "")}?text=${club.shortName}+II`,
      category: "camisa",
      sizes: ["P", "M", "G", "GG", "XGG"],
      colors: ["Reserva"],
      inStock: true,
      isNew: true,
    },
    {
      name: `Camisa ${club.name} III 2024`,
      description: `Terceira camisa do ${club.name} com design especial comemorativo.`,
      price: 319.90,
      imageUrl: `https://placehold.co/400x500/333333/FFFFFF?text=${club.shortName}+III`,
      category: "camisa",
      sizes: ["P", "M", "G", "GG"],
      colors: ["Especial"],
      inStock: true,
      isNew: true,
    },
    {
      name: `Agasalho ${club.name} Treino 2024`,
      description: `Agasalho oficial de treino do ${club.name}. Perfeito para dias frios.`,
      price: 449.90,
      originalPrice: 499.90,
      imageUrl: `https://placehold.co/400x500/${club.primaryColor.replace("#", "")}/FFFFFF?text=${club.shortName}+Agasalho`,
      category: "agasalho",
      sizes: ["P", "M", "G", "GG", "XGG"],
      inStock: true,
      discount: 10,
    },
    {
      name: `Jaqueta ${club.name} Viagem`,
      description: `Jaqueta de viagem oficial usada pelos jogadores do ${club.name}.`,
      price: 399.90,
      imageUrl: `https://placehold.co/400x500/1a1a1a/${club.primaryColor.replace("#", "")}?text=${club.shortName}+Jaqueta`,
      category: "agasalho",
      sizes: ["P", "M", "G", "GG"],
      inStock: true,
    },
    {
      name: `Shorts ${club.name} Treino`,
      description: `Shorts de treino oficial do ${club.name}. Leve e confortável.`,
      price: 129.90,
      imageUrl: `https://placehold.co/400x500/${club.primaryColor.replace("#", "")}/${club.secondaryColor.replace("#", "")}?text=${club.shortName}+Shorts`,
      category: "shorts",
      sizes: ["P", "M", "G", "GG"],
      inStock: true,
    },
    {
      name: `Shorts ${club.name} Jogo`,
      description: `Shorts oficial de jogo do ${club.name}. Mesmo modelo usado pelos atletas.`,
      price: 159.90,
      imageUrl: `https://placehold.co/400x500/${club.secondaryColor.replace("#", "")}/${club.primaryColor.replace("#", "")}?text=${club.shortName}+Short`,
      category: "shorts",
      sizes: ["P", "M", "G", "GG", "XGG"],
      inStock: true,
    },
    {
      name: `Boné ${club.name} Oficial`,
      description: `Boné oficial do ${club.name} com escudo bordado.`,
      price: 89.90,
      imageUrl: `https://placehold.co/400x500/${club.primaryColor.replace("#", "")}/${club.secondaryColor.replace("#", "")}?text=${club.shortName}+Bone`,
      category: "acessorio",
      colors: ["Preto", "Branco"],
      inStock: true,
    },
    {
      name: `Mochila ${club.name}`,
      description: `Mochila oficial do ${club.name} com compartimento para notebook.`,
      price: 199.90,
      originalPrice: 249.90,
      imageUrl: `https://placehold.co/400x500/1a1a1a/${club.primaryColor.replace("#", "")}?text=${club.shortName}+Mochila`,
      category: "acessorio",
      inStock: true,
      discount: 20,
    },
    {
      name: `Cachecol ${club.name}`,
      description: `Cachecol oficial do ${club.name}. Mostre seu amor pelo clube.`,
      price: 69.90,
      imageUrl: `https://placehold.co/400x500/${club.primaryColor.replace("#", "")}/${club.secondaryColor.replace("#", "")}?text=${club.shortName}+Cachecol`,
      category: "acessorio",
      inStock: true,
    },
    {
      name: `Chuteira ${club.name} Pro`,
      description: `Chuteira edição especial ${club.name}. Tecnologia de ponta para máximo desempenho.`,
      price: 599.90,
      originalPrice: 699.90,
      imageUrl: `https://placehold.co/400x500/${club.primaryColor.replace("#", "")}/${club.secondaryColor.replace("#", "")}?text=${club.shortName}+Chuteira`,
      category: "calcado",
      sizes: ["38", "39", "40", "41", "42", "43", "44"],
      inStock: true,
      featured: true,
      discount: 14,
    },
    {
      name: `Tênis ${club.name} Casual`,
      description: `Tênis casual do ${club.name} para o dia a dia do torcedor.`,
      price: 349.90,
      imageUrl: `https://placehold.co/400x500/2a2a2a/${club.primaryColor.replace("#", "")}?text=${club.shortName}+Tenis`,
      category: "calcado",
      sizes: ["38", "39", "40", "41", "42", "43"],
      inStock: true,
    },
    {
      name: `Camisa ${club.name} Infantil I 2024`,
      description: `Camisa infantil oficial do ${club.name}. Para os pequenos torcedores.`,
      price: 199.90,
      imageUrl: `https://placehold.co/400x500/${club.primaryColor.replace("#", "")}/${club.secondaryColor.replace("#", "")}?text=${club.shortName}+Kids`,
      category: "infantil",
      sizes: ["2", "4", "6", "8", "10", "12", "14"],
      inStock: true,
    },
    {
      name: `Kit ${club.name} Infantil Completo`,
      description: `Kit completo infantil do ${club.name}: camisa, shorts e meião.`,
      price: 279.90,
      originalPrice: 329.90,
      imageUrl: `https://placehold.co/400x500/${club.primaryColor.replace("#", "")}/${club.secondaryColor.replace("#", "")}?text=${club.shortName}+Kit`,
      category: "infantil",
      sizes: ["2", "4", "6", "8", "10", "12"],
      inStock: true,
      discount: 15,
    },
  ];

  return baseProducts.map((product, index) => ({
    ...product,
    id: `${club.id}-${index}`,
    clubId: club.id,
  }));
};

// Generate all products for Serie A clubs
export const allProducts: Product[] = brazilianClubs
  .filter((club) => club.league === "serie_a")
  .flatMap(generateClubProducts);

export const getProductsByClub = (clubId: string): Product[] => {
  return allProducts.filter((product) => product.clubId === clubId);
};

export const getProductsByCategory = (category: ProductCategory): Product[] => {
  return allProducts.filter((product) => product.category === category);
};

export const getFeaturedProducts = (): Product[] => {
  return allProducts.filter((product) => product.featured);
};

export const getNewProducts = (): Product[] => {
  return allProducts.filter((product) => product.isNew);
};

export const getDiscountedProducts = (): Product[] => {
  return allProducts.filter((product) => product.discount && product.discount > 0);
};

export const getProductById = (id: string): Product | undefined => {
  return allProducts.find((product) => product.id === id);
};

export const searchProducts = (query: string): Product[] => {
  const lowerQuery = query.toLowerCase();
  return allProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(lowerQuery) ||
      product.description.toLowerCase().includes(lowerQuery)
  );
};
