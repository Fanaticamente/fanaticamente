// Real products scraped from official Flamengo store
// URL: https://loja.flamengo.com.br/mantos/jogo-1/masculino

import { Product } from "./shopProducts";

export interface RealProduct extends Omit<Product, "id" | "clubId"> {
  id: string;
  clubId: string;
  externalUrl: string;
  source: "official_store";
}

export const flamengoRealProducts: RealProduct[] = [
  {
    id: "fla-real-1",
    name: "Manto Flamengo Jogo 1 BETANO Adidas 2025",
    description: "Camisa oficial do Flamengo Jogo 1 com patrocínio BETANO. Material de alta qualidade Adidas para a temporada 2025.",
    price: 399.99,
    imageUrl: "https://flamengo.vtexassets.com/arquivos/ids/177008-390-390?v=638853314008630000&width=390&height=390&aspect=true",
    category: "camisa",
    sizes: ["P", "M", "G", "GG", "2GG"],
    inStock: true,
    isNew: true,
    clubId: "flamengo",
    externalUrl: "https://loja.flamengo.com.br/manto-flamengo-jogo-1-betano-adidas-2025/p",
    source: "official_store",
  },
  {
    id: "fla-real-2",
    name: "Manto Flamengo Authentic Jogo 1 Adidas 2025",
    description: "Versão Authentic do Manto Flamengo Jogo 1 Adidas 2025. O mesmo modelo usado pelos jogadores em campo.",
    price: 699.99,
    imageUrl: "https://flamengo.vtexassets.com/arquivos/ids/173792-390-390?v=638788661974900000&width=390&height=390&aspect=true",
    category: "camisa",
    sizes: ["P", "M", "G", "GG", "2GG"],
    inStock: true,
    isNew: true,
    featured: true,
    clubId: "flamengo",
    externalUrl: "https://loja.flamengo.com.br/manto-flamengo-authentic-jogo-1-adidas-2025/p",
    source: "official_store",
  },
  {
    id: "fla-real-3",
    name: "Manto Flamengo Jogo 1 Adidas 2025",
    description: "Camisa oficial do Flamengo Jogo 1 Adidas para a temporada 2025. Design clássico rubro-negro.",
    price: 399.99,
    imageUrl: "https://flamengo.vtexassets.com/arquivos/ids/177008-390-390?v=638853314008630000&width=390&height=390&aspect=true",
    category: "camisa",
    sizes: ["P", "M", "G", "GG", "2GG"],
    inStock: true,
    isNew: true,
    clubId: "flamengo",
    externalUrl: "https://loja.flamengo.com.br/manto-flamengo-jogo-1-adidas-2025/p",
    source: "official_store",
  },
  {
    id: "fla-real-4",
    name: "Manto Flamengo Jogo 1 Adidas 2025 – Com Kit Patrocínio – B. Henrique 27",
    description: "Camisa oficial do Flamengo com nome e número do jogador Bruno Henrique. Inclui kit de patrocínio completo.",
    price: 559.88,
    imageUrl: "https://flamengo.vtexassets.com/arquivos/ids/185116-390-390?v=638991547596630000&width=390&height=390&aspect=true",
    category: "camisa",
    sizes: ["P", "M", "G", "GG", "2GG"],
    inStock: true,
    isNew: true,
    clubId: "flamengo",
    externalUrl: "https://loja.flamengo.com.br/manto-flamengo-jogo-1-adidas-2025-com-kit-patrocinio-b--henrique-27/p",
    source: "official_store",
  },
  {
    id: "fla-real-5",
    name: "Manto Flamengo Jogo 1 Adidas 2025 – Com Kit Patrocínio – Jorginho 21",
    description: "Camisa oficial do Flamengo com nome e número do jogador Jorginho. Inclui kit de patrocínio completo.",
    price: 559.88,
    imageUrl: "https://flamengo.vtexassets.com/arquivos/ids/185228-390-390?v=638991559293530000&width=390&height=390&aspect=true",
    category: "camisa",
    sizes: ["P", "M", "G", "GG", "2GG"],
    inStock: true,
    isNew: true,
    clubId: "flamengo",
    externalUrl: "https://loja.flamengo.com.br/manto-flamengo-jogo-1-adidas-2025-%E2%80%93-com-kit-patrocinio-%E2%80%93-jorginho-21/p",
    source: "official_store",
  },
  {
    id: "fla-real-6",
    name: "Manto Flamengo Jogo 1 Adidas 2025 – Com Kit Patrocínio – Saúl 8",
    description: "Camisa oficial do Flamengo com nome e número do jogador Saúl. Inclui kit de patrocínio completo.",
    price: 559.88,
    imageUrl: "https://flamengo.vtexassets.com/arquivos/ids/185390-390-390?v=638991603156830000&width=390&height=390&aspect=true",
    category: "camisa",
    sizes: ["P", "M", "G", "GG", "2GG"],
    inStock: true,
    isNew: true,
    clubId: "flamengo",
    externalUrl: "https://loja.flamengo.com.br/manto-flamengo-jogo-1-adidas-2025-%E2%80%93-com-kit-patrocinio-%E2%80%93-saul-8/p",
    source: "official_store",
  },
  {
    id: "fla-real-7",
    name: "Manto Flamengo Jogo 1 Adidas 2025 – Com Kit Patrocínio – Pedro 9",
    description: "Camisa oficial do Flamengo com nome e número do jogador Pedro. Inclui kit de patrocínio completo.",
    price: 559.88,
    imageUrl: "https://flamengo.vtexassets.com/arquivos/ids/185290-390-390?v=638991570485000000&width=390&height=390&aspect=true",
    category: "camisa",
    sizes: ["P", "M", "G", "GG", "2GG"],
    inStock: true,
    isNew: true,
    clubId: "flamengo",
    externalUrl: "https://loja.flamengo.com.br/manto-flamengo-jogo-1-adidas-2025---com-kit-patrocinio---pedro-9/p",
    source: "official_store",
  },
  {
    id: "fla-real-8",
    name: "Regata Flamengo Basquete 1 Adidas 25/26",
    description: "Regata oficial do Flamengo Basquete para a temporada 25/26. Design exclusivo Adidas.",
    price: 399.99,
    imageUrl: "https://flamengo.vtexassets.com/arquivos/ids/170619-390-390?v=638729346198870000&width=390&height=390&aspect=true",
    category: "camisa",
    sizes: ["P", "M", "G", "GG", "2GG"],
    inStock: true,
    isNew: true,
    clubId: "flamengo",
    externalUrl: "https://loja.flamengo.com.br/regata-flamengo-basquete-1-adidas-25-26/p",
    source: "official_store",
  },
  {
    id: "fla-real-9",
    name: "Regata Flamengo Basquete 1 Adidas 24/25",
    description: "Regata oficial do Flamengo Basquete para a temporada 24/25. Material leve e respirável.",
    price: 349.99,
    imageUrl: "https://flamengo.vtexassets.com/arquivos/ids/170619-390-390?v=638729346198870000&width=390&height=390&aspect=true",
    category: "camisa",
    sizes: ["P", "M", "G", "GG", "2GG"],
    inStock: true,
    clubId: "flamengo",
    externalUrl: "https://loja.flamengo.com.br/regata-flamengo-basquete-1-adidas-24-25/p",
    source: "official_store",
  },
  {
    id: "fla-real-10",
    name: "Manto Flamengo Manga Longa Jogo 1 Adidas 2024",
    description: "Versão manga longa do Manto Flamengo Jogo 1 Adidas 2024. Ideal para dias mais frios.",
    price: 449.99,
    imageUrl: "https://flamengo.vtexassets.com/arquivos/ids/169026-390-390?v=638729345174830000&width=390&height=390&aspect=true",
    category: "camisa",
    sizes: ["P", "M", "G", "GG", "2GG"],
    inStock: true,
    clubId: "flamengo",
    externalUrl: "https://loja.flamengo.com.br/manto-flamengo-manga-longa-jogo-1-adidas-2024/p",
    source: "official_store",
  },
  {
    id: "fla-real-11",
    name: "Manto Flamengo Fan Jogo 1 Adidas 2024",
    description: "Versão Fan do Manto Flamengo. Opção mais acessível mantendo a qualidade Adidas.",
    price: 199.99,
    imageUrl: "https://flamengo.vtexassets.com/arquivos/ids/169266-390-390?v=638735996285700000&width=390&height=390&aspect=true",
    category: "camisa",
    sizes: ["P", "M", "G", "GG", "2GG"],
    inStock: true,
    discount: 33,
    originalPrice: 299.99,
    clubId: "flamengo",
    externalUrl: "https://loja.flamengo.com.br/manto-flamengo-fan-jogo-1-adidas-2024/p",
    source: "official_store",
  },
  {
    id: "fla-real-12",
    name: "Manto Flamengo Authentic Jogo 1 Adidas 2024",
    description: "Versão Authentic do Manto Flamengo 2024. Tecnologia de ponta igual à usada pelos jogadores.",
    price: 599.99,
    imageUrl: "https://flamengo.vtexassets.com/arquivos/ids/169031-390-390?v=638729345669370000&width=390&height=390&aspect=true",
    category: "camisa",
    sizes: ["P", "M", "G", "GG", "2GG"],
    inStock: true,
    featured: true,
    clubId: "flamengo",
    externalUrl: "https://loja.flamengo.com.br/manto-flamengo-authentic-jogo-1-adidas-2024/p",
    source: "official_store",
  },
];

// Get all real products for a specific club
export const getRealProductsByClub = (clubId: string): RealProduct[] => {
  if (clubId === "flamengo") {
    return flamengoRealProducts;
  }
  return [];
};

// Get all real products
export const getAllRealProducts = (): RealProduct[] => {
  return [...flamengoRealProducts];
};

// Check if a club has real products
export const hasRealProducts = (clubId: string): boolean => {
  return clubId === "flamengo";
};
