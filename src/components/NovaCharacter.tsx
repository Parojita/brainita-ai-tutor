import brainitaAvatar from "@/assets/brainita-ai.png.asset.json";

export type BrainitaState = "ready" | "thinking" | "speaking";

type Props = {
  focus?: string | null;
  status?: string;
  name?: string;
  compact?: boolean;
  /** Visual state of the character. */
  state?: BrainitaState;
  /** Optional character image override. Defaults to the Brainita AI avatar. */
  imageSrc?: string | undefined;
};

export function NovaCharacter({
  focus,
  status,
  name = "Brainita AI",
  compact = false,
  state = "ready",
  imageSrc,
}: Props) {
  const src = imageSrc ?? brainitaAvatar.url;
  const label =
    status ??
    (state === "thinking"
      ? "Brainita AI is thinking…"
      : state === "speaking"
        ? "Brainita AI is speaking…"
        : "Ready to help");

  return (
    <div className="flex flex-col items-center">
      <div className="relative grid place-items-center">
        <div
          className={`absolute size-40 rounded-full animate-ringpulse ${
            state === "thinking" ? "opacity-100" : state === "speaking" ? "opacity-90" : "opacity-60"
          }`}
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--primary) 50%, transparent), transparent 70%)",
            animationDuration: state === "thinking" ? "1.1s" : state === "speaking" ? "0.7s" : "2.4s",
          }}
        />
        <div
          className={`relative ${compact ? "size-24" : "size-36"} overflow-hidden rounded-full grid place-items-center animate-floaty border border-glow/40 bg-panel-strong`}
          style={{
            boxShadow:
              state === "ready"
                ? "var(--shadow-glow)"
                : "0 0 34px color-mix(in oklab, var(--primary) 60%, transparent)",
          }}
        >
          <img
            src={src}
            alt={`${name} character`}
            className="size-full object-cover object-top"
          />
          <span className="absolute bottom-3 right-3 size-4 rounded-full bg-accent shadow-[0_0_12px_var(--accent)]" />
        </div>
      </div>

      {state === "speaking" ? (
        <div className="mt-3 flex items-end gap-1 h-4" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="w-1 rounded-full bg-accent animate-soundwave"
              style={{ animationDelay: `${i * 0.12}s` }}
            />
          ))}
        </div>
      ) : null}

      <div className="mt-4 text-center">
        <p className="font-display font-semibold text-xl">{name}</p>
        <p className="text-xs text-accent mt-0.5">{label}</p>
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
