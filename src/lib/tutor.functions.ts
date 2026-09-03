import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { streamText } from "ai";
import { z } from "zod";

const AskInput = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(40),
  student: z.object({
    name: z.string().optional(),
    classLevel: z.number().nullable().optional(),
    board: z.string().nullable().optional(),
    goal: z.string().nullable().optional(),
    weak: z.array(z.string()).optional(),
    strong: z.array(z.string()).optional(),
    minutes: z.number().optional(),
  }),
});

export const askNova = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AskInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured yet.");

    const gateway = createOpenAICompatible({
      name: "lovable",
      baseURL: "https://ai.gateway.lovable.dev/v1",
      headers: { "Lovable-API-Key": key },
    });

    const s = data.student;
    const system = [
      "You are Nova, a warm, encouraging AI tutor inside Brainita AI, an app for Indian school students from Class 4 to Class 12.",
      s.name ? `The student's name is ${s.name}.` : "",
      s.classLevel ? `They are in Class ${s.classLevel}.` : "",
      s.board ? `Their board is ${s.board}.` : "",
      s.goal ? `Their goal is: ${s.goal}.` : "",
      s.weak?.length ? `They find these subjects hard: ${s.weak.join(", ")}.` : "",
      s.strong?.length ? `They are strong in: ${s.strong.join(", ")}.` : "",
      s.minutes ? `They can study about ${s.minutes} minutes a day.` : "",
      "Explain step by step with simple, age-appropriate language and everyday analogies.",
      "Keep answers concise (under ~200 words unless asked for more), use markdown, and end with a short check-for-understanding question.",
      s.classLevel && s.classLevel < 11
        ? "Never mention NEET, JEE or WBJEE — this student is below Class 11."
        : "",
      "Never help with cheating during a live exam; encourage understanding instead.",
    ]
      .filter(Boolean)
      .join(" ");

    try {
      const result = streamText({
        model: gateway("google/gemini-3.5-flash"),
        system,
        messages: data.messages,
      });
      return { reply: await result.text };
    } catch (error) {
      const status = (error as { statusCode?: number; status?: number })?.statusCode ??
        (error as { status?: number })?.status;
      if (status === 429) throw new Error("Nova is getting a lot of questions right now. Try again in a moment.");
      if (status === 402) throw new Error("AI credits have run out. Please top up in Lovable to keep tutoring.");
      throw new Error("Nova couldn't answer that right now. Please try again.");
    }
  });
