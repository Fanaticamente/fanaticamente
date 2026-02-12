import { useState, useEffect } from "react";
import { Bot, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface AISecretaryChatProps {
  professionalId: string;
}

const AISecretaryChat = ({ professionalId }: AISecretaryChatProps) => {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchMessage = async () => {
    setLoading(true);
    setError(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/professional-secretary`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) throw new Error("Erro ao buscar mensagem");

      const data = await response.json();
      setMessage(data.message);
    } catch (err) {
      console.error("AI Secretary error:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessage();
  }, [professionalId]);

  if (error) {
    return (
      <Card className="bg-primary/5 border-primary/20 mb-4">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">
                Não foi possível carregar o resumo. 
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchMessage}
                className="mt-1 text-primary hover:text-primary/80 p-0 h-auto"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Tentar novamente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-primary/5 border-primary/20 mb-4">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                Secretária Virtual
              </span>
              {!loading && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchMessage}
                  className="p-0 h-auto text-muted-foreground hover:text-primary"
                >
                  <RefreshCw className="w-3 h-3" />
                </Button>
              )}
            </div>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                {message}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AISecretaryChat;
