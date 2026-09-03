import { supabase } from "@/integrations/supabase/client";

const FALLBACK = "Brainita AI is having trouble connecting right now. Please try again.";

/**
 * Calls the brainita-chat Supabase Edge Function, which validates the
 * Supabase session, derives user_id server-side, and forwards to n8n.
 * The n8n webhook URL never reaches the browser.
 */
export async function askBrainita(message: string): Promise<{ reply: string }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) throw new Error("Not signed in");

  const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/brainita-chat`;

  const res = await fetch(functionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    throw new Error(FALLBACK);
  }

  const data = (await res.json()) as { reply?: string };
  return { reply: data.reply?.trim() || FALLBACK };
}
