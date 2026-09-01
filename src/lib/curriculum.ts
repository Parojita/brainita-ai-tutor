export const CLASSES = [4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export const BOARDS = ["CBSE", "ICSE", "WBBSE / WBCHSE", "State Board", "IB / IGCSE"] as const;

export const JUNIOR_GOALS = [
  "Score better in school exams",
  "Build strong fundamentals",
  "Finish homework faster",
  "Olympiad preparation",
  "Improve English & writing",
] as const;

export const SENIOR_GOALS = [
  "Board exam preparation",
  "NEET preparation",
  "JEE preparation",
  "WBJEE preparation",
  "Olympiad preparation",
  "Improve overall grades",
] as const;

/** NEET / JEE / WBJEE goals only unlock from Class 11 onwards. */
export function goalsForClass(classLevel: number | null | undefined): readonly string[] {
  if (classLevel && classLevel >= 11) return SENIOR_GOALS;
  return JUNIOR_GOALS;
}

export const JUNIOR_SUBJECTS = [
  "Mathematics",
  "Science",
  "English",
  "Hindi",
  "Bengali",
  "Social Studies",
  "Computer",
] as const;

export const SENIOR_SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "Computer Science",
  "Economics",
  "History",
  "Geography",
] as const;

export function subjectsForClass(classLevel: number | null | undefined): readonly string[] {
  if (classLevel && classLevel >= 9) return SENIOR_SUBJECTS;
  return JUNIOR_SUBJECTS;
}

export const STUDY_TIMES = [30, 45, 60, 90, 120, 180];

export function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h} hour${h > 1 ? "s" : ""}`;
}
