type Props = {
  focus?: string | null;
  status?: string;
  name?: string;
  compact?: boolean;
};

export function NovaCharacter({
  focus,
  status = "Listening · ready when you are",
  name = "Nova",
  compact = false,
}: Props) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative grid place-items-center">
        <div
          className="absolute size-40 rounded-full animate-ringpulse"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--primary) 50%, transparent), transparent 70%)",
          }}
        />
        <div
          className={`relative ${compact ? "size-24" : "size-36"} rounded-full grid place-items-center animate-floaty border border-glow/40 bg-panel-strong`}
          style={{ boxShadow: "var(--shadow-glow)" }}
        >
          <span className="font-display font-bold text-5xl text-foreground">
            {name.charAt(0)}
          </span>
          <span className="absolute bottom-3 right-3 size-4 rounded-full bg-accent shadow-[0_0_12px_var(--accent)]" />
        </div>
      </div>
      <div className="mt-5 text-center">
        <p className="font-display font-semibold text-xl">{name}</p>
        <p className="text-xs text-accent mt-0.5">{status}</p>
      </div>
      {focus ? (
        <div className="mt-5 w-full flex items-center gap-2 text-xs bg-foreground/5 border border-border rounded-xl px-3 py-2">
          <span className="text-accent">●</span>
          <span className="text-muted-foreground">
            Current focus: <span className="text-foreground">{focus}</span>
          </span>
        </div>
      ) : null}
    </div>
  );
}
