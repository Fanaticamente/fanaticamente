import { useState, useEffect, useRef } from "react";
import { RefreshCw, Send, ChevronDown, ChevronUp, Bot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AISecretaryChatProps {
  professionalId: string;
}

const getStorageKey = (professionalId: string) => `assistant-chat-${professionalId}`;

const getTodayDateStr = () => new Date().toISOString().split("T")[0];

const loadCachedMessages = (professionalId: string): Message[] | null => {
  try {
    const raw = localStorage.getItem(getStorageKey(professionalId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.date !== getTodayDateStr()) {
      localStorage.removeItem(getStorageKey(professionalId));
      return null;
    }
    return parsed.messages as Message[];
  } catch {
    return null;
  }
};

const saveCachedMessages = (professionalId: string, messages: Message[]) => {
  localStorage.setItem(
    getStorageKey(professionalId),
    JSON.stringify({ date: getTodayDateStr(), messages })
  );
};

const AISecretaryChat = ({ professionalId }: AISecretaryChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);
  const [input, setInput] = useState("");
  const [expanded, setExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [messages]);

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      saveCachedMessages(professionalId, messages);
    }
  }, [messages, professionalId]);

  const callSecretary = async (chatMessages: Message[] = []) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/professional-secretary`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ messages: chatMessages }),
        }
      );

      if (response.status === 429) {
        toast.error("Limite de requisições atingido. Aguarde um momento.");
        return null;
      }

      if (!response.ok) throw new Error("Erro ao buscar mensagem");

      const data = await response.json();
      return data.message as string;
    } catch (err) {
      console.error("AI Secretary error:", err);
      return null;
    }
  };

  const fetchInitialMessage = async () => {
    setLoading(true);
    setError(false);

    // Check cache first
    const cached = loadCachedMessages(professionalId);
    if (cached && cached.length > 0) {
      setMessages(cached);
      setLoading(false);
      return;
    }

    const message = await callSecretary();
    if (message) {
      setMessages([{ role: "assistant", content: message }]);
    } else {
      setError(true);
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMessage: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setSending(true);
    setExpanded(true);

    const reply = await callSecretary(updatedMessages);
    if (reply) {
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } else {
      setMessages(prev => [...prev, { role: "assistant", content: "Desculpe, não consegui processar sua pergunta. Tente novamente." }]);
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    fetchInitialMessage();
  }, [professionalId]);

  if (error && messages.length === 0) {
    return (
      <Card className="bg-primary/5 border-primary/20 mb-4">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Bot className="w-7 h-7 text-primary" aria-hidden="true" />
          </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">
                Não foi possível carregar o resumo.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchInitialMessage}
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
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Bot className="w-7 h-7 text-primary" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-bold text-primary uppercase tracking-wide">
              Assistente
            </span>
          </div>
          {messages.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="p-1 h-auto text-muted-foreground hover:text-primary"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          )}
        </div>

        {/* Messages */}
        <div className={`space-y-3 ${expanded || messages.length <= 1 ? "" : "overflow-y-auto max-h-48"}`}>
          {loading ? (
            <div className="space-y-2 pl-12">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-background border border-border rounded-bl-md"
                  }`}
                >
                  <p className="whitespace-pre-line" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                </div>
              </div>
            ))
          )}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-background border border-border rounded-2xl rounded-bl-md px-3 py-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {!loading && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-primary/10">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder=""
              className="flex-1 text-sm bg-background border-border"
              disabled={sending}
            />
            <Button
              size="sm"
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className="h-9 w-9 p-0 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AISecretaryChat;
