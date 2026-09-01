import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { profileQuery } from "@/lib/profile";
import { AppShell } from "@/components/AppShell";
import { NovaCharacter } from "@/components/NovaCharacter";
import {
  BOARDS,
  CLASSES,
  STUDY_TIMES,
  formatMinutes,
  goalsForClass,
  subjectsForClass,
} from "@/lib/curriculum";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your study plan — Brainita AI" },
      {
        name: "description",
        content:
          "Tell Nova your class, board, goal, weak and strong subjects and daily study time to get a personalised tutoring plan.",
      },
      { property: "og:title", content: "Set up your study plan — Brainita AI" },
      {
        property: "og:description",
        content: "A few quick answers and Nova builds your study plan.",
      },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: profile } = useQuery(profileQuery(user?.id));

  const [name, setName] = useState("");
  const [classLevel, setClassLevel] = useState<number | null>(null);
  const [board, setBoard] = useState<string | null>(null);
  const [goal, setGoal] = useState<string | null>(null);
  const [weak, setWeak] = useState<string[]>([]);
  const [strong, setStrong] = useState<string[]>([]);
  const [minutes, setMinutes] = useState(60);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!profile) return;
    setName(profile.full_name || "");
    setClassLevel(profile.class_level);
    setBoard(profile.board);
    setGoal(profile.goal);
    setWeak(profile.weak_subjects ?? []);
    setStrong(profile.strong_subjects ?? []);
    setMinutes(profile.daily_minutes ?? 60);
  }, [profile]);

  const goals = useMemo(() => goalsForClass(classLevel), [classLevel]);
  const subjects = useMemo(() => subjectsForClass(classLevel), [classLevel]);

  useEffect(() => {
    if (goal && !goals.includes(goal)) setGoal(null);
  }, [goals, goal]);

  const toggle = (list: string[], set: (v: string[]) => void, value: string, other: string[], setOther: (v: string[]) => void) => {
    if (list.includes(value)) set(list.filter((v) => v !== value));
    else {
      set([...list, value]);
      if (other.includes(value)) setOther(other.filter((v) => v !== value));
    }
  };

  const save = async () => {
    if (!user) return;
    if (!name.trim() || !classLevel || !board || !goal) {
      toast.error("Please fill in your name, class, board and goal.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: name.trim(),
      class_level: classLevel,
      board,
      goal,
      weak_subjects: weak,
      strong_subjects: strong,
      daily_minutes: minutes,
      onboarded: true,
    });
    setBusy(false);
    if (error) {
      toast.error("Could not save your plan. Please try again.");
      return;
    }
    navigate({ to: "/tutor" });
  };

  return (
    <AppShell studentName={name}>
      <div className="grid lg:grid-cols-[minmax(0,300px)_1fr] gap-5 items-start">
        <aside className="panel-surface rounded-3xl p-5">
          <NovaCharacter status="Getting to know you" focus={null} />
          <p className="mt-5 text-sm text-muted-foreground text-center text-pretty">
            Seven quick answers. Nova plans around your class, board and weak spots.
          </p>
        </aside>

        <section className="panel-surface rounded-3xl p-6 sm:p-8 space-y-7">
          <div>
            <h1 className="font-display font-bold text-3xl">Tell Nova where you are</h1>
            <p className="text-muted-foreground text-sm mt-1">No wrong answers here.</p>
          </div>

          <Block label="Your name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Aarav Sharma"
              className="w-full max-w-sm rounded-xl bg-panel-strong border border-border px-4 py-2.5 text-sm outline-none focus:border-primary/60"
            />
          </Block>

          <Block label="Class">
            <ChipRow>
              {CLASSES.map((c) => (
                <Chip key={c} active={classLevel === c} onClick={() => setClassLevel(c)}>
                  Class {c}
                </Chip>
              ))}
            </ChipRow>
          </Block>

          <Block label="Board">
            <ChipRow>
              {BOARDS.map((b) => (
                <Chip key={b} active={board === b} onClick={() => setBoard(b)}>
                  {b}
                </Chip>
              ))}
            </ChipRow>
          </Block>

          <Block
            label="Goal"
            hint={
              classLevel && classLevel < 11
                ? "Competitive exam goals unlock from Class 11"
                : undefined
            }
          >
            <ChipRow>
              {goals.map((g) => (
                <Chip key={g} active={goal === g} onClick={() => setGoal(g)}>
                  {g}
                </Chip>
              ))}
            </ChipRow>
          </Block>

          <div className="grid sm:grid-cols-2 gap-6">
            <Block label="Weak subjects">
              <ChipRow>
                {subjects.map((s) => (
                  <Chip
                    key={s}
                    tone="warn"
                    active={weak.includes(s)}
                    onClick={() => toggle(weak, setWeak, s, strong, setStrong)}
                  >
                    {s}
                  </Chip>
                ))}
              </ChipRow>
            </Block>
            <Block label="Strong subjects">
              <ChipRow>
                {subjects.map((s) => (
                  <Chip
                    key={s}
                    tone="good"
                    active={strong.includes(s)}
                    onClick={() => toggle(strong, setStrong, s, weak, setWeak)}
                  >
                    {s}
                  </Chip>
                ))}
              </ChipRow>
            </Block>
          </div>

          <Block label={`Daily study time · ${formatMinutes(minutes)}`}>
            <ChipRow>
              {STUDY_TIMES.map((m) => (
                <Chip key={m} active={minutes === m} onClick={() => setMinutes(m)}>
                  {formatMinutes(m)}
                </Chip>
              ))}
            </ChipRow>
          </Block>

          <button
            onClick={save}
            disabled={busy}
            className="w-full sm:w-auto gradient-brand text-primary-foreground font-semibold text-sm rounded-xl px-6 py-3 disabled:opacity-60"
          >
            {busy ? "Saving…" : "Continue to my tutor"}
          </button>
        </section>
      </div>
    </AppShell>
  );
}

function Block({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-accent">{label}</p>
      {hint ? <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p> : null}
      <div className="mt-2.5">{children}</div>
    </div>
  );
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

function Chip({
  active,
  onClick,
  children,
  tone = "primary",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  tone?: "primary" | "warn" | "good";
}) {
  const activeClass =
    tone === "warn"
      ? "bg-destructive/20 border-destructive/50 text-foreground"
      : tone === "good"
        ? "bg-accent/20 border-accent/50 text-foreground"
        : "gradient-brand text-primary-foreground border-transparent";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-sm rounded-full border px-3.5 py-1.5 transition ${
        active
          ? activeClass
          : "bg-foreground/5 border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
      }`}
    >
      {children}
    </button>
  );
}
