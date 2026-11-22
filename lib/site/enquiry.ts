import { z } from "zod";

const text = (max: number) => z.string().trim().max(max);

/** Shared by the form and the API route, so both check the same rules. */
export const enquirySchema = z.object({
  kind: z.enum(["proof", "pilot", "question"]),
  niche: z.enum(["forex", "product", "manual_testing"]).nullable(),
  name: text(120).min(1, "Add your name"),
  email: z.string().trim().max(254).email("Use a work email we can reply to"),
  company: text(160).min(1, "Add your company"),
  website: text(300)
    .refine((v) => v === "" || /^(https?:\/\/)?[a-z0-9.-]+\.[a-z]{2,}(\/\S*)?$/i.test(v), "Use a web address like yourcompany.com")
    .optional()
    .default(""),
  role: text(120).optional().default(""),
  message: text(4000).min(20, "Tell us a little more (at least 20 characters)"),
  consent: z.literal(true, { message: "Tick the box so we can reply to you" }),
  // Anti-spam: a field people never see, and how long the form was open.
  nickname: z.string().max(0).optional().default(""),
  elapsedMs: z.number().int().nonnegative(),
});

export type Enquiry = z.infer<typeof enquirySchema>;
