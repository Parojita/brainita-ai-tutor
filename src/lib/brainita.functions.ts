import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const ChatInput = z.object({
  message: z.string().min(1).max(4000),
});

const FALLBACK =
  "Brainita AI is having trouble connecting right now. Please try again.";

/**
 * Frontend -> this server function -> n8n webhook -> AI workflow -> reply.
 * The webhook URL never reaches the browser.
 */
export const askBrainita = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ChatInput.parse(input))
  .handler(async ({ data, context }) => {
    const webhook = process.env["N8N_BRAINITA_WEBHOOK_URL"];
    if (!webhook) return { reply: FALLBACK };

    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: context.userId,
          message: data.message,
        }),
      });
      if (!res.ok) return { reply: FALLBACK };

      const raw = (await res.json().catch(() => null)) as
        | { reply?: unknown }
        | Array<{ reply?: unknown }>
        | null;
      const payload = Array.isArray(raw) ? raw[0] : raw;
      const reply = typeof payload?.reply === "string" ? payload.reply.trim() : "";
      return { reply: reply || FALLBACK };
    } catch {
      return { reply: FALLBACK };
    }
  });
