import { supabase } from "@/integrations/supabase/client";

export const db = supabase;

export type Profile = {
  id: string;
  user_id: string;
  name: string | null;
  class: number | null;
  board: string | null;
  goal: string | null;
  daily_minutes: number | null;
};

export type Strength = "Weak" | "Average" | "Strong";

export type StudentProfile = {
  profile: Profile | null;
  weak_subjects: string[];
  strong_subjects: string[];
  onboarded: boolean;
};

export const profileQuery = (userId: string | undefined) => ({
  queryKey: ["profile", userId],
  enabled: Boolean(userId),
  queryFn: async (): Promise<StudentProfile> => {
    if (!userId) return { profile: null, weak_subjects: [], strong_subjects: [], onboarded: false };

    const [{ data: profile, error }, { data: subjects, error: subjectError }] = await Promise.all([
      db.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      db.from("student_subjects").select("subject, strength").eq("user_id", userId),
    ]);
    if (error) throw error;
    if (subjectError) throw subjectError;

    const rows = (subjects ?? []) as Array<{ subject: string; strength: Strength }>;
    const p = (profile as Profile | null) ?? null;

    return {
      profile: p,
      weak_subjects: rows.filter((r) => r.strength === "Weak").map((r) => r.subject),
      strong_subjects: rows.filter((r) => r.strength === "Strong").map((r) => r.subject),
      onboarded: Boolean(p && p.name && p.class && p.board && p.goal),
    };
  },
});

export async function saveStudentProfile(input: {
  userId: string;
  name: string;
  classLevel: number;
  board: string;
  goal: string;
  dailyMinutes: number;
  weak: string[];
  strong: string[];
}) {
  const { error } = await db.from("profiles").upsert(
    {
      user_id: input.userId,
      name: input.name,
      class: input.classLevel,
      board: input.board,
      goal: input.goal,
      daily_minutes: input.dailyMinutes,
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;

  // Replace only this student's subject rows.
  const { error: deleteError } = await db
    .from("student_subjects")
    .delete()
    .eq("user_id", input.userId);
  if (deleteError) throw deleteError;

  const rows = [
    ...input.weak.map((subject) => ({ user_id: input.userId, subject, strength: "Weak" })),
    ...input.strong.map((subject) => ({ user_id: input.userId, subject, strength: "Strong" })),
  ];
  if (rows.length) {
    const { error: insertError } = await db.from("student_subjects").insert(rows);
    if (insertError) throw insertError;
  }
}

export type StoredMessage = { role: "user" | "assistant"; content: string };

export async function loadMessages(userId: string): Promise<StoredMessage[]> {
  const { data, error } = await db
    .from("messages")
    .select("role, content")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as StoredMessage[];
}

export async function saveMessage(userId: string, message: StoredMessage) {
  await db.from("messages").insert({ user_id: userId, ...message });
}
