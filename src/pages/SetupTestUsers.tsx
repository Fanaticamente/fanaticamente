import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, Loader2, UserPlus } from "lucide-react";

interface TestUser {
  email: string;
  password: string;
  fullName: string;
  role: "user" | "professional" | "developer" | "admin";
  created: boolean;
  loading: boolean;
}

const SetupTestUsers = () => {
  const [users, setUsers] = useState<TestUser[]>([
    { email: "universal@teste.com", password: "123456", fullName: "Usuário Universal", role: "user", created: false, loading: false },
    { email: "user@teste.com", password: "123456", fullName: "Torcedor Teste", role: "user", created: false, loading: false },
    { email: "profissional@teste.com", password: "123456", fullName: "Dr. Psicólogo Teste", role: "professional", created: false, loading: false },
    { email: "dev@teste.com", password: "123456", fullName: "Desenvolvedor Teste", role: "developer", created: false, loading: false },
    { email: "admin@teste.com", password: "123456", fullName: "Administrador Teste", role: "admin", created: false, loading: false },
  ]);
  const [isCreatingAll, setIsCreatingAll] = useState(false);

  const createUser = async (index: number) => {
    const user = users[index];
    
    setUsers(prev => prev.map((u, i) => i === index ? { ...u, loading: true } : u));

    try {
      // Create auth user
      const { data, error } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: user.fullName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        const isUniversal = user.email === "universal@teste.com";

        // For universal user, call edge function with service_role to bypass RLS
        if (isUniversal) {
          const { error: setupError } = await supabase.functions.invoke("setup-test-user", {
            body: { user_id: data.user.id },
          });
          if (setupError) console.error("Setup universal user error:", setupError);

        } else if (user.role !== "user") {
          // Add additional role if not just 'user'
          const { error: roleError } = await supabase
            .from("user_roles")
            .insert({ user_id: data.user.id, role: user.role });
          if (roleError) console.error("Role error:", roleError);
        }

        setUsers(prev => prev.map((u, i) => i === index ? { ...u, created: true, loading: false } : u));
        toast.success(`${user.fullName} criado com sucesso!`);
      }
    } catch (error: any) {
      console.error(error);
      if (error.message?.includes("already registered")) {
        setUsers(prev => prev.map((u, i) => i === index ? { ...u, created: true, loading: false } : u));
        toast.info(`${user.email} já existe`);
      } else {
        toast.error(`Erro ao criar ${user.email}: ${error.message}`);
        setUsers(prev => prev.map((u, i) => i === index ? { ...u, loading: false } : u));
      }
    }

    // Sign out after creating to allow creating next user
    await supabase.auth.signOut();
  };

  const createAllUsers = async () => {
    setIsCreatingAll(true);
    for (let i = 0; i < users.length; i++) {
      if (!users[i].created) {
        await createUser(i);
        // Small delay between creations
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    setIsCreatingAll(false);
    toast.success("Todos os usuários de teste foram criados!");
  };

  const getRoleColor = (role: string, email?: string) => {
    if (email === "universal@teste.com") return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    switch (role) {
      case "admin": return "bg-destructive/20 text-destructive border-destructive/30";
      case "developer": return "bg-secondary/20 text-secondary border-secondary/30";
      case "professional": return "bg-therapy/20 text-therapy border-therapy/30";
      default: return "bg-primary/20 text-primary border-primary/30";
    }
  };

  const getRoleLabel = (role: string, email?: string) => {
    if (email === "universal@teste.com") return "Universal";
    switch (role) {
      case "admin": return "Administrador";
      case "developer": return "Desenvolvedor";
      case "professional": return "Profissional";
      default: return "Usuário";
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl text-primary mb-2">
            fanática<span className="text-secondary">MENTE</span>
          </h1>
          <p className="text-muted-foreground">
            Configuração de Usuários de Teste
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl text-card-foreground">Usuários de Teste</h2>
            <button
              onClick={createAllUsers}
              disabled={isCreatingAll || users.every(u => u.created)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingAll ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              Criar Todos
            </button>
          </div>

          <div className="space-y-4">
            {users.map((user, index) => (
              <div
                key={user.email}
                className={`p-4 rounded-xl border ${user.created ? "bg-green-500/10 border-green-500/30" : "bg-muted border-border"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-card-foreground font-medium">{user.fullName}</p>
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${getRoleColor(user.role, user.email)}`}>
                        {getRoleLabel(user.role, user.email)}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      <span className="font-mono">{user.email}</span>
                    </p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Senha: <span className="font-mono">{user.password}</span>
                    </p>
                  </div>
                  {user.created ? (
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <button
                      onClick={() => createUser(index)}
                      disabled={user.loading || isCreatingAll}
                      className="px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {user.loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Criar"
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-display text-lg text-card-foreground mb-3">Como testar:</h3>
          <ul className="space-y-2 text-muted-foreground text-sm">
            <li className="flex gap-2">
              <span className="text-primary">1.</span>
              <span>Clique em "Criar Todos" para criar os usuários</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">2.</span>
              <span>Vá para <span className="font-mono text-primary">/auth</span> para login de usuário/profissional</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">3.</span>
              <span>Vá para <span className="font-mono text-destructive">/admin-access</span> para login de admin/dev</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">4.</span>
              <span>Após login, acesse <span className="font-mono text-primary">/perfil</span> para ver seus painéis</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SetupTestUsers;
