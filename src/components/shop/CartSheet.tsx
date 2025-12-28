import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

const CartSheet = () => {
  const { items, removeFromCart, updateQuantity, getTotal, getItemCount, clearCart } = useCart();

  const formatPrice = (price: number) => {
    return price.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const handleCheckout = () => {
    toast.success("Redirecionando para o checkout...");
    // Here you would integrate with a payment gateway
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="w-5 h-5" />
          {getItemCount() > 0 && (
            <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs bg-primary">
              {getItemCount()}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Meu Carrinho ({getItemCount()} {getItemCount() === 1 ? "item" : "itens"})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <ShoppingCart className="w-16 h-16 opacity-50" />
            <p>Seu carrinho está vazio</p>
            <p className="text-sm text-center">
              Adicione produtos para começar suas compras
            </p>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4 py-4">
                {items.map((item) => (
                  <div
                    key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`}
                    className="flex gap-3 bg-muted/50 rounded-lg p-3"
                  >
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-20 h-24 object-cover rounded-md"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-2">
                        {item.product.name}
                      </h4>
                      <div className="flex gap-2 mt-1">
                        {item.selectedSize && (
                          <span className="text-xs text-muted-foreground">
                            Tam: {item.selectedSize}
                          </span>
                        )}
                        {item.selectedColor && (
                          <span className="text-xs text-muted-foreground">
                            Cor: {item.selectedColor}
                          </span>
                        )}
                      </div>
                      <p className="text-primary font-bold mt-1">
                        {formatPrice(item.product.price)}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity - 1)
                            }
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-sm font-medium w-6 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity + 1)
                            }
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="border-t pt-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(getTotal())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Frete</span>
                  <span className="text-green-500">Grátis</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(getTotal())}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button className="w-full" size="lg" onClick={handleCheckout}>
                  Finalizar Compra
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    clearCart();
                    toast.success("Carrinho limpo!");
                  }}
                >
                  Limpar Carrinho
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Pagamento 100% seguro • Entrega para todo Brasil
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartSheet;
