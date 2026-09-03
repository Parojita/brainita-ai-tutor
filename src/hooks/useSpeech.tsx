import { useCallback, useEffect, useRef, useState } from "react";

/** Lightweight wrapper around the browser Speech Synthesis API. */
export function useSpeech() {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  const stop = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    utterRef.current = null;
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      if (muted || !text.trim()) return;
      window.speechSynthesis.cancel();
      // strip simple markdown so it reads naturally
      const clean = text
        .replace(/[*_`#>]/g, "")
        .replace(/\[(.*?)\]\(.*?\)/g, "$1")
        .trim();
      const u = new SpeechSynthesisUtterance(clean);
      u.rate = 1;
      u.pitch = 1;
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      utterRef.current = u;
      setSpeaking(true);
      window.speechSynthesis.speak(u);
    },
    [muted],
  );

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      if (!m) {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
        }
        setSpeaking(false);
      }
      return !m;
    });
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { supported, speaking, muted, speak, stop, toggleMute };
}
