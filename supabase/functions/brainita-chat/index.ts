import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const FALLBACK = "Brainita AI is having trouble connecting right now. Please try again.";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ reply: FALLBACK }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    if (!token || token.split(".").length !== 3) {
      return new Response(JSON.stringify({ reply: FALLBACK }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({ reply: FALLBACK }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ reply: FALLBACK }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claims.claims.sub;

    let body: { message?: unknown };
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ reply: FALLBACK }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message || message.length > 4000) {
      return new Response(JSON.stringify({ reply: FALLBACK }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const webhook = Deno.env.get("N8N_WEBHOOK_URL");
    if (!webhook) {
      return new Response(JSON.stringify({ reply: FALLBACK }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const n8nRes = await fetch(webhook, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message, user_id: userId }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!n8nRes.ok) {
        return new Response(JSON.stringify({ reply: FALLBACK }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const raw = await n8nRes.text();
      let reply = "";

      // Try JSON first, then fall back to plain text
      try {
        const parsed = JSON.parse(raw);
        const payload = Array.isArray(parsed) ? parsed[0] : parsed;
        if (typeof payload?.reply === "string") {
          reply = payload.reply;
        } else if (typeof parsed === "string") {
          reply = parsed;
        }
      } catch {
        reply = raw;
      }

      reply = reply.trim();
      return new Response(JSON.stringify({ reply: reply || FALLBACK }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch {
      clearTimeout(timeout);
      return new Response(JSON.stringify({ reply: FALLBACK }), {
        status: 504,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch {
    return new Response(JSON.stringify({ reply: FALLBACK }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
