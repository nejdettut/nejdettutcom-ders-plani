import { z } from "zod";

export const GRADE_LEVELS = [
  "ilkokul-1",
  "ilkokul-2",
  "ilkokul-3",
  "ilkokul-4",
  "ortaokul-5",
  "ortaokul-6",
  "ortaokul-7",
  "ortaokul-8",
  "lise-9",
  "lise-10",
  "lise-11",
  "lise-12",
] as const;

export const GRADE_LABELS: Record<(typeof GRADE_LEVELS)[number], string> = {
  "ilkokul-1": "1. Sınıf (İlkokul)",
  "ilkokul-2": "2. Sınıf (İlkokul)",
  "ilkokul-3": "3. Sınıf (İlkokul)",
  "ilkokul-4": "4. Sınıf (İlkokul)",
  "ortaokul-5": "5. Sınıf (Ortaokul)",
  "ortaokul-6": "6. Sınıf (Ortaokul)",
  "ortaokul-7": "7. Sınıf (Ortaokul)",
  "ortaokul-8": "8. Sınıf (Ortaokul)",
  "lise-9": "9. Sınıf (Lise)",
  "lise-10": "10. Sınıf (Lise)",
  "lise-11": "11. Sınıf (Lise)",
  "lise-12": "12. Sınıf (Lise)",
};

export const TEACHING_METHODS = [
  "duz-anlatim",
  "etkinlik-temelli",
  "proje-temelli",
  "sunus-yoluyla",
  "bulus-yoluyla",
  "harmanlanmis",
] as const;

export const METHOD_LABELS: Record<(typeof TEACHING_METHODS)[number], string> = {
  "duz-anlatim": "Düz anlatım",
  "etkinlik-temelli": "Etkinlik temelli öğrenme",
  "proje-temelli": "Proje tabanlı öğrenme",
  "sunus-yoluyla": "Sunuş yoluyla öğretim",
  "bulus-yoluyla": "Buluş yoluyla öğretim",
  harmanlanmis: "Harmanlanmış (karma)",
};

export const DURATIONS = ["40", "80", "120"] as const;

export const LessonPlanRequestSchema = z.object({
  subject: z.string().min(2).max(120),
  topic: z.string().min(3).max(300),
  grade: z.enum(GRADE_LEVELS),
  duration: z.enum(DURATIONS),
  method: z.enum(TEACHING_METHODS),
  notes: z.string().max(500).optional(),
});

export const LessonPlanSchema = z.object({
  title: z.string(),
  summary: z.string(),
  objectives: z.array(z.string()).min(3).max(8),
  keyConcepts: z.array(z.string()).min(3).max(10),
  materials: z.array(z.string()).min(2).max(10),
  introduction: z.object({
    durationMinutes: z.number().int().min(1).max(30),
    activities: z.array(z.string()).min(1).max(5),
  }),
  development: z.object({
    durationMinutes: z.number().int().min(10).max(90),
    steps: z
      .array(
        z.object({
          stepTitle: z.string(),
          description: z.string(),
          durationMinutes: z.number().int().min(1).max(60),
        }),
      )
      .min(2)
      .max(6),
  }),
  assessment: z.object({
    durationMinutes: z.number().int().min(1).max(30),
    activities: z.array(z.string()).min(1).max(5),
    sampleQuestions: z.array(z.string()).min(2).max(6),
  }),
  homework: z.string(),
  differentiation: z.array(z.string()).min(1).max(5),
  curriculumAlignment: z.string(),
});

export type LessonPlan = z.infer<typeof LessonPlanSchema>;
export type LessonPlanRequest = z.infer<typeof LessonPlanRequestSchema>;
