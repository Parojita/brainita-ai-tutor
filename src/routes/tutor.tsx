import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { profileQuery, loadMessages, saveMessage } from "@/lib/profile";
import { askBrainita } from "@/lib/brainita.functions";
import { AppShell } from "@/components/AppShell";
import { NovaCharacter, type BrainitaState } from "@/components/NovaCharacter";
import { useSpeech } from "@/hooks/useSpeech";
import { formatMinutes } from "@/lib/curriculum";

export const Route = createFileRoute("/tutor")({
  head: () => ({
    meta: [
      { title: "AI Tutor — chat with Brainita AI" },
      {
        name: "description",
        content:
          "Ask Brainita AI to explain any topic, quiz you or plan your study session — step by step, in simple language.",
      },
      { property: "og:title", content: "AI Tutor — chat with Brainita AI" },
      {
        property: "og:description",
        content: "A friendly AI tutor that explains, quizzes and plans your study day.",
      },
    ],
  }),
  component: TutorPage,
});

type Msg = { role: "user" | "assistant"; content: string };

const PROMPTS = ["Explain a topic", "Quiz me", "Plan today"];

function TutorPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: student } = useQuery(profileQuery(user?.id));
  const profile = student?.profile ?? null;
  const { supported, speaking, muted, speak, stop, toggleMute } = useSpeech();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (student && !student.onboarded) navigate({ to: "/onboarding" });
  }, [student, navigate]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    loadMessages(user.id)
      .then((history) => {
        if (!cancelled && history.length) setMessages(history);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!profile || messages.length) return;
    const first = profile.name?.split(" ")[0] || "there";
    const weak = student?.weak_subjects?.[0];
    setMessages([
      {
        role: "assistant",
        content: `Hey ${first}! Ready to study?${
          weak ? ` We could start with **${weak}** — that's where you asked for help.` : ""
        } Ask me anything, or tap a suggestion below.`,
      },
    ]);
  }, [profile, student, messages.length]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const send = async (text: string) => {
    const clean = text.trim();
    if (!clean || thinking) return;
    stop();
    const next: Msg[] = [...messages, { role: "user", content: clean }];
    setMessages(next);
    setInput("");
    setThinking(true);
    try {
      const res = await askBrainita(clean);
      setMessages([...next, { role: "assistant", content: res.reply }]);
      speak(res.reply);
      if (user) {
        await saveMessage(user.id, { role: "user", content: clean });
        await saveMessage(user.id, { role: "assistant", content: res.reply });
      }
    } catch {
      const fallback = "Brainita AI is having trouble connecting right now. Please try again.";
      setMessages([...next, { role: "assistant", content: fallback }]);
      toast.error(fallback);
    } finally {
      setThinking(false);
    }
  };

  const focus = student?.weak_subjects?.[0] ?? profile?.goal ?? null;
  const state: BrainitaState = thinking ? "thinking" : speaking ? "speaking" : "ready";

  return (
    <AppShell studentName={profile?.name ?? undefined}>
      <div className="grid grid-cols-[minmax(0,1fr)] items-end gap-3 mb-6 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display font-bold text-3xl sm:text-4xl">
            Meet Brainita AI, your AI tutor
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {profile
              ? `Class ${profile.class ?? "—"} · ${profile.board ?? "—"} · Goal: ${profile.goal ?? "—"}`
              : "Loading your plan…"}
          </p>
        </div>
        <span className="justify-self-start text-xs font-medium px-3 py-1.5 rounded-full bg-primary/15 border border-primary/30 text-glow">
          Tutoring session live
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,300px)_1fr] gap-5">
        <aside className="panel-surface rounded-3xl p-5">
          <NovaCharacter focus={focus} state={state} />
          {supported ? (
            <button
              type="button"
              onClick={toggleMute}
              aria-pressed={muted}
              className="mt-4 w-full text-xs font-semibold px-3 py-2 rounded-xl bg-foreground/5 border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground transition"
            >
              {muted ? "🔇 Unmute Brainita" : "🔊 Mute Brainita"}
            </button>
          ) : null}
          <div className="mt-3 flex items-center gap-2 text-xs bg-foreground/5 border border-border rounded-xl px-3 py-2">
            <span className="text-primary">◆</span>
            <span className="text-muted-foreground">
              Daily goal:{" "}
              <span className="text-foreground">{formatMinutes(profile?.daily_minutes ?? 60)}</span>
            </span>
          </div>
        </aside>

        <section className="panel-surface rounded-3xl flex flex-col min-h-[520px]">
          <div className="px-5 pt-5 pb-3 border-b border-border">
            <p className="font-display font-semibold">Ask Brainita AI anything</p>
            <p className="text-xs text-muted-foreground">
              Explain, quiz, or plan your next session.
            </p>
          </div>

          <div className="flex-1 px-4 sm:px-5 py-5 space-y-4 overflow-y-auto max-h-[60vh]">
            {messages.map((m, i) =>
              m.role === "assistant" ? (
                <div key={i} className="flex gap-3 animate-rise">
                  <div className="size-8 shrink-0 rounded-full grid place-items-center font-display font-semibold text-sm text-primary-foreground gradient-brand">
                    B
                  </div>
                  <div className="max-w-[85%] min-w-0">
                    <div className="rounded-2xl rounded-tl-sm bg-panel-strong border border-border px-4 py-3 text-sm leading-relaxed prose-nova">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                    <p className="text-[11px] text-muted-foreground/70 mt-1">
                      Brainita AI · AI Tutor
                    </p>
                  </div>
                </div>
              ) : (
                <div key={i} className="flex gap-3 flex-row-reverse animate-rise">
                  <div className="size-8 shrink-0 rounded-full bg-primary/20 border border-primary/40 grid place-items-center font-display font-semibold text-sm text-glow">
                    {(profile?.name || "You").charAt(0).toUpperCase()}
                  </div>
                  <div className="max-w-[80%] min-w-0">
                    <div className="rounded-2xl rounded-tr-sm gradient-brand text-primary-foreground px-4 py-3 text-sm leading-relaxed">
                      {m.content}
                    </div>
                    <p className="text-[11px] text-muted-foreground/70 mt-1 text-right">You</p>
                  </div>
                </div>
              ),
            )}
            {thinking ? (
              <p className="text-xs text-accent pl-11">Brainita AI is thinking…</p>
            ) : null}
            <div ref={endRef} />
          </div>

          <div className="px-4 pb-4 pt-2 border-t border-border">
            <div className="flex flex-wrap gap-2 mb-3">
              {PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="text-xs px-3 py-1.5 rounded-full bg-foreground/5 border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground transition"
                >
                  {p}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 rounded-2xl bg-panel-strong border border-border px-4 py-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message Brainita AI…"
                className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70 py-1.5"
              />
              <button
                disabled={thinking}
                className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg gradient-brand text-primary-foreground disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
