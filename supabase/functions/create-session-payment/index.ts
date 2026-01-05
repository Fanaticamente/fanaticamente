import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-SESSION-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const { professionalId, scheduledDate, scheduledTime } = await req.json();
    logStep("Request data", { professionalId, scheduledDate, scheduledTime });

    if (!professionalId || !scheduledDate || !scheduledTime) {
      throw new Error("Missing required fields: professionalId, scheduledDate, scheduledTime");
    }

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user?.email) {
      throw new Error("User not authenticated");
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get professional data with Stripe Connect info
    const { data: professional, error: professionalError } = await supabaseClient
      .from("professionals")
      .select("id, user_id, hourly_rate, stripe_account_id, stripe_account_status")
      .eq("id", professionalId)
      .single();

    if (professionalError || !professional) {
      throw new Error("Professional not found");
    }
    logStep("Professional found", { 
      professionalId: professional.id, 
      hourlyRate: professional.hourly_rate,
      stripeAccountId: professional.stripe_account_id 
    });

    if (!professional.stripe_account_id || professional.stripe_account_status !== "active") {
      throw new Error("Professional has not completed Stripe Connect setup");
    }

    // Get professional's profile for name
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("full_name")
      .eq("user_id", professional.user_id)
      .single();

    const sessionPrice = professional.hourly_rate || 150;
    const amountInCents = Math.round(sessionPrice * 100);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    }

    const origin = req.headers.get("origin") || "http://localhost:5173";

    // Create a checkout session with transfer to connected account
    // Stripe fees will be deducted automatically from the payment
    // PIX + Card payment methods enabled for Brazilian customers
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      payment_method_types: ["card", "pix"],
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: `Sessão de Terapia - ${profile?.full_name || "Profissional"}`,
              description: `Data: ${scheduledDate} às ${scheduledTime}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      payment_intent_data: {
        // Transfer full amount to connected account after Stripe fees
        transfer_data: {
          destination: professional.stripe_account_id,
        },
        metadata: {
          professional_id: professionalId,
          user_id: user.id,
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime,
        },
      },
      success_url: `${origin}/pagamento/confirmacao/${professionalId}?date=${scheduledDate}&time=${scheduledTime}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pagamento/${professionalId}?date=${scheduledDate}&time=${scheduledTime}&canceled=true`,
      metadata: {
        professional_id: professionalId,
        user_id: user.id,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
