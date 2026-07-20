import { z } from "zod";

export const createChildSchema = z.object({
  fullName: z.string().min(1).max(100),
  nickname: z.string().max(50).optional(),
  birthDate: z.coerce.date(),
  themeColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default("#D946EF"),
  titleFont: z.string().default("serif"),
  description: z.string().max(2000).optional(),
});

export const updateChildSchema = createChildSchema.partial().extend({
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
});

export const createYearbookSchema = z.object({
  childId: z.string().cuid(),
  title: z.string().min(1).max(100),
  yearNumber: z.number().int().positive().optional(),
  periodStart: z.coerce.date().optional(),
  periodEnd: z.coerce.date().optional(),
  ageLabel: z.string().max(50).optional(),
  template: z.enum(["EDITORIAL", "TIMELINE", "ALBUM"]).default("EDITORIAL"),
  customCoverTitle: z.string().max(200).optional(),
});

export const createMilestoneSchema = z.object({
  yearbookId: z.string().cuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  eventDate: z.coerce.date().optional(),
  ageLabel: z.string().max(50).optional(),
  locationId: z.string().cuid().optional(),
});

export const createTimelineEntrySchema = z.object({
  yearbookId: z.string().cuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  eventDate: z.coerce.date(),
  month: z.number().int().min(1).max(12).optional(),
  locationId: z.string().cuid().optional(),
});

export const updateMilestoneSchema = createMilestoneSchema
  .omit({ yearbookId: true })
  .partial();

export const updateTimelineEntrySchema = createTimelineEntrySchema
  .omit({ yearbookId: true })
  .partial();

export const updateStorySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.union([z.string().max(50000), z.record(z.string(), z.unknown())]).optional(),
});

export const updateParentNoteSchema = z.object({
  content: z.string().min(1).max(5000).optional(),
  author: z.string().min(1).max(100).optional(),
});

export const updateFutureLetterSchema = z.object({
  content: z.string().min(1).max(10000).optional(),
  signature: z.string().max(200).optional().nullable(),
});

export const createStorySchema = z.object({
  yearbookId: z.string().cuid(),
  title: z.string().min(1).max(200),
  content: z.record(z.string(), z.unknown()),
  isFeatured: z.boolean().default(false),
});

export const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const exportOptionsSchema = z.object({
  yearbookId: z.string().cuid(),
  format: z.enum(["PDF", "HTML", "JSON", "ZIP"]),
  includeOriginals: z.boolean().default(true),
  includeVideos: z.boolean().default(true),
  includeQrCodes: z.boolean().default(false),
});

export type CreateChildInput = z.infer<typeof createChildSchema>;
export type CreateYearbookInput = z.infer<typeof createYearbookSchema>;
export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
export type CreateTimelineEntryInput = z.infer<typeof createTimelineEntrySchema>;
export type ExportOptionsInput = z.infer<typeof exportOptionsSchema>;
