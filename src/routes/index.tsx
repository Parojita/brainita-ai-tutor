import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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
          "Sign in to Brainita AI, a friendly AI tutor built for CBSE, ICSE and state board students from Class 4 to Class 12.",
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
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/tutor" });
  }, [loading, user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { name },
          },
        });
        if (error) throw error;

        if (data.user && !data.session) {
          setEmailSent(true);
          return;
        }
        toast.success("Welcome to Brainita AI!");
        navigate({ to: "/onboarding" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/onboarding" });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      if (message.includes("Invalid login credentials")) {
        toast.error("Wrong email or password. Please try again.");
      } else if (
        message.includes("User already registered") ||
        message.includes("already been registered")
      ) {
        toast.error("An account with this email already exists. Try signing in instead.");
      } else if (message.includes("Email not confirmed")) {
        toast.error("Please check your email and click the confirmation link before signing in.");
      } else if (message.includes("Failed to fetch") || message.includes("network")) {
        toast.error("Network error. Please check your connection and try again.");
      } else {
        toast.error(message);
      }
    } finally {
      setBusy(false);
    }
  };

  if (emailSent) {
    return (
      <AppShell showNav={false}>
        <div className="grid lg:grid-cols-[minmax(0,320px)_1fr] gap-5 items-start mt-6">
          <aside className="panel-surface rounded-3xl p-6">
            <NovaCharacter status="Waiting for you" focus={null} />
            <p className="mt-5 text-sm text-muted-foreground text-center text-pretty">
              Brainita AI is ready when you are.
            </p>
          </aside>

          <section className="panel-surface rounded-3xl p-6 sm:p-8">
            <h1 className="font-display font-bold text-3xl">Check your email</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              We sent a confirmation link to{" "}
              <span className="font-semibold text-foreground">{email}</span>. Click the link in the
              email to activate your account, then sign in.
            </p>
            <button
              type="button"
              onClick={() => {
                setEmailSent(false);
                setMode("login");
              }}
              className="mt-6 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-glow transition hover:bg-primary/15"
            >
              Back to sign in
            </button>
          </section>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell showNav={false}>
      <div className="grid lg:grid-cols-[minmax(0,320px)_1fr] gap-5 items-start mt-6">
        <aside className="panel-surface rounded-3xl p-6">
          <NovaCharacter status="Waiting to meet you" focus={null} />
          <p className="mt-5 text-sm text-muted-foreground text-center text-pretty">
            Brainita AI adapts to your class, board and weak subjects — and plans around the time
            you actually have.
          </p>
        </aside>

        <section className="panel-surface rounded-3xl p-6 sm:p-8">
          <h1 className="font-display font-bold text-3xl sm:text-4xl">
            {mode === "login" ? "Welcome back" : "Start studying with Brainita AI"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">For students in Class 4 to Class 12.</p>

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
