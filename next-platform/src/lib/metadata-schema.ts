import { z } from "zod";
export const metadataSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(20).max(3000),
  grade: z.number().int().min(1).max(12),
  subjectId: z.uuid(),
  outcomeIds: z.array(z.uuid()).max(0).default([]),
  outcomeRefs: z
    .array(
      z.object({
        catalogId: z.string().regex(/^[a-f0-9]{64}$/),
        outcomeId: z.string().min(1).max(150),
      }),
    )
    .max(20)
    .default([]),
  catalogId: z
    .string()
    .regex(/^[a-f0-9]{64}$/)
    .optional(),
  programId: z.string().min(1).max(150).optional(),
  academicYear: z
    .string()
    .regex(/^\d{4}[–-]\d{4}$/)
    .default("2026–2027"),
  schoolType: z.string().max(200).optional(),
  entrypoint: z.string().max(250).optional(),
});
