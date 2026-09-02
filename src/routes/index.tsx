import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { NovaCharacter } from "@/components/NovaCharacter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Brainita AI — AI study tutor for Class 4 to 12" },
      {
        name: "description",
        content:
          "Sign in to Brainita AI and study with Brainita AI, a friendly AI tutor built for CBSE, ICSE and state board students from Class 4 to Class 12.",
      },
      { property: "og:title", content: "Brainita AI — AI study tutor for Class 4 to 12" },
      {
        property: "og:description",
        content: "Your personal AI tutor for school, boards and beyond.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/tutor" });
  }, [loading, user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success("Welcome to Brainita AI!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/onboarding" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/onboarding" });
  };

  return (
    <AppShell showNav={false}>
      <div className="grid lg:grid-cols-[minmax(0,320px)_1fr] gap-5 items-start mt-6">
        <aside className="panel-surface rounded-3xl p-6">
          <NovaCharacter status="Waiting to meet you" focus={null} />
          <p className="mt-5 text-sm text-muted-foreground text-center text-pretty">
            Brainita AI adapts to your class, board and weak subjects — and plans around the time you
            actually have.
          </p>
        </aside>

        <section className="panel-surface rounded-3xl p-6 sm:p-8">
          <h1 className="font-display font-bold text-3xl sm:text-4xl">
            {mode === "login" ? "Welcome back" : "Start studying with Brainita AI"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            For students in Class 4 to Class 12.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4 max-w-md">
            {mode === "signup" ? (
              <Field label="Full name">
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Aarav Sharma"
                  className="w-full rounded-xl bg-panel-strong border border-border px-4 py-2.5 text-sm outline-none focus:border-primary/60"
                />
              </Field>
            ) : null}
            <Field label="Email">
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl bg-panel-strong border border-border px-4 py-2.5 text-sm outline-none focus:border-primary/60"
              />
            </Field>
            <Field label="Password">
              <input
                required
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-xl bg-panel-strong border border-border px-4 py-2.5 text-sm outline-none focus:border-primary/60"
              />
            </Field>

            <button
              disabled={busy}
              className="w-full gradient-brand text-primary-foreground font-semibold text-sm rounded-xl px-4 py-3 disabled:opacity-60"
            >
              {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create my account"}
            </button>

            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
            </div>

            <button
              type="button"
              onClick={google}
              className="w-full rounded-xl border border-border bg-foreground/5 px-4 py-3 text-sm font-medium hover:border-primary/40"
            >
              Continue with Google
            </button>

            <p className="text-sm text-muted-foreground">
              {mode === "login" ? "New to Brainita?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="text-glow hover:underline"
              >
                {mode === "login" ? "Create an account" : "Sign in"}
              </button>
            </p>
          </form>
        </section>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
