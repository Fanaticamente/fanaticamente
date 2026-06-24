import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: userData, error: userErr } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userData.user.id);
    if (!(roles || []).some((r: any) => r.role === "admin")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, password, full_name } = await req.json();
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "email and password required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let userId: string | undefined;
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { full_name: full_name || "Marketing" },
    });

    if (createErr) {
      const { data: list } = await supabase.auth.admin.listUsers();
      const found = list.users.find((u: any) => u.email === email);
      if (!found) throw createErr;
      userId = found.id;
      await supabase.auth.admin.updateUserById(userId, { password, email_confirm: true });
    } else {
      userId = created.user!.id;
    }

    const { error: roleErr } = await supabase
      .from("user_roles")
      .upsert({ user_id: userId, role: "marketing" }, { onConflict: "user_id,role" });
    if (roleErr) console.error("role err", roleErr);

    return new Response(JSON.stringify({ success: true, user_id: userId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});