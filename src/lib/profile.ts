import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  full_name: string;
  class_level: number | null;
  board: string | null;
  goal: string | null;
  weak_subjects: string[];
  strong_subjects: string[];
  daily_minutes: number;
  onboarded: boolean;
};

export const profileQuery = (userId: string | undefined) => ({
  queryKey: ["profile", userId],
  enabled: Boolean(userId),
  queryFn: async (): Promise<Profile | null> => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw error;
    return (data as Profile) ?? null;
  },
});
