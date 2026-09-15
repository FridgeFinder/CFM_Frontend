import { z } from 'zod';

export const fridgeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  street: z.string().min(5, 'Street must be at least 5 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  state: z.string().length(2, 'State must be a 2-letter code'),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid zip code format'),
  notes: z.string().optional(),
});

export type FridgeFormData = z.infer<typeof fridgeSchema>;

export const reportSchema = z.object({
  condition: z.enum([
    'good',
    'dirty',
    'out of order',
    'not at location',
    'ghost',
  ]),
  foodPercentage: z.number().min(0).max(3),
  notes: z.string().optional(),
});

export type ReportFormData = z.infer<typeof reportSchema>;
