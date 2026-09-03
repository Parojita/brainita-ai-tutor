import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { profileQuery } from "@/lib/profile";
import { AppShell } from "@/components/AppShell";
import { formatMinutes } from "@/lib/curriculum";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — Brainita AI" },
      {
        name: "description",
        content: "Review your Brainita AI learning profile and study preferences.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: student, isLoading } = useQuery(profileQuery(user?.id));
  const profile = student?.profile ?? null;

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!isLoading && user && student && !student.onboarded) {
      navigate({ to: "/onboarding" });
    }
  }, [isLoading, user, student, navigate]);

  if (loading || isLoading || !user || !profile) {
    return (
      <AppShell studentName={profile?.name}>
        <section className="panel-surface rounded-3xl p-6 sm:p-8">
          <p className="text-sm text-muted-foreground">Loading your profile…</p>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell studentName={profile.name}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section className="panel-surface rounded-3xl p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-accent">Student profile</p>
              <h1 className="mt-1 font-display text-3xl font-bold">
                {profile.name || "Your profile"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                These details help Brainita AI personalise explanations and study advice.
              </p>
            </div>
            <Link
              to="/onboarding"
              className="rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-glow transition hover:bg-primary/15"
            >
              Edit profile
            </Link>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <InfoCard label="Class" value={profile.class ? `Class ${profile.class}` : "Not set"} />
            <InfoCard label="Board" value={profile.board || "Not set"} />
            <InfoCard label="Goal" value={profile.goal || "Not set"} />
            <InfoCard label="Daily study time" value={formatMinutes(profile.daily_minutes ?? 60)} />
          </div>

          <div className="mt-7 grid gap-6 sm:grid-cols-2">
            <SubjectGroup
              label="Weak subjects"
              items={student?.weak_subjects ?? []}
              emptyText="No weak subjects selected."
              tone="warn"
            />
            <SubjectGroup
              label="Strong subjects"
              items={student?.strong_subjects ?? []}
              emptyText="No strong subjects selected."
              tone="good"
            />
          </div>
        </section>

        <aside className="panel-surface rounded-3xl p-5">
          <p className="text-xs uppercase tracking-widest text-accent">Brainita profile</p>
          <div className="mt-4 size-16 rounded-2xl gradient-brand grid place-items-center font-display text-2xl font-bold text-primary-foreground">
            {(profile.name || "S").charAt(0).toUpperCase()}
          </div>
          <p className="mt-4 font-display text-xl font-semibold">
            {profile.name || "Student"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {profile.class ? `Class ${profile.class}` : "Class not set"}
            {profile.board ? ` · ${profile.board}` : ""}
          </p>
          <Link
            to="/tutor"
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl gradient-brand px-4 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Back to Brainita AI
          </Link>
        </aside>
      </div>
    </AppShell>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-foreground/5 p-4">
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 font-display font-semibold">{value}</p>
    </div>
  );
}

function SubjectGroup({
  label,
  items,
  emptyText,
  tone,
}: {
  label: string;
  items: string[];
  emptyText: string;
  tone: "warn" | "good";
}) {
  const chipClass =
    tone === "warn"
      ? "border-destructive/40 bg-destructive/15"
      : "border-accent/40 bg-accent/15";

  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-accent">{label}</p>
      {items.length ? (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item}
              className={`rounded-full border px-3 py-1.5 text-sm ${chipClass}`}
            >
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-2.5 text-sm text-muted-foreground">{emptyText}</p>
      )}
    </div>
  );
}
