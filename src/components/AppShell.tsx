import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  children: ReactNode;
  studentName?: string;
  showNav?: boolean;
};

export function AppShell({ children, studentName, showNav = true }: Props) {
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <div
        className="pointer-events-none fixed inset-0"
        style={{ background: "var(--gradient-aura)" }}
      />
      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8 pb-12">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-5">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <div
              className="size-10 shrink-0 rounded-xl grid place-items-center font-display font-bold text-lg text-primary-foreground gradient-brand"
              style={{ boxShadow: "var(--shadow-glow)" }}
            >
              B
            </div>
            <div className="min-w-0 leading-tight">
              <p className="truncate font-display font-semibold text-lg">Brainita AI</p>
              <p className="truncate text-[11px] text-muted-foreground -mt-0.5">
                Adaptive study companion
              </p>
            </div>
          </Link>
          {showNav ? (
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <nav className="hidden sm:flex items-center gap-1 text-sm">
                <Link
                  to="/tutor"
                  className="px-3 py-1.5 rounded-full text-muted-foreground hover:text-foreground"
                  activeProps={{ className: "px-3 py-1.5 rounded-full bg-foreground/8 text-foreground" }}
                >
                  Tutor
                </Link>
                <Link
                  to="/profile"
                  className="px-3 py-1.5 rounded-full text-muted-foreground hover:text-foreground"
                  activeProps={{ className: "px-3 py-1.5 rounded-full bg-foreground/8 text-foreground" }}
                >
                  Profile
                </Link>
              </nav>
              <div className="size-8 shrink-0 rounded-full bg-panel-strong border border-primary/40 grid place-items-center font-display font-semibold text-sm text-glow">
                {(studentName || "S").charAt(0).toUpperCase()}
              </div>
              <button
                onClick={signOut}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Sign out
              </button>
            </div>
          ) : null}
        </header>
        {children}
        <p className="text-center text-[11px] text-muted-foreground/60 mt-10">
          Brainita AI · Designed for Class 4–12 learners
        </p>
      </div>
    </div>
  );
}
