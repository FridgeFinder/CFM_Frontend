import { z } from 'zod';

export const emailSchema = z.object({
  email: z.email('Please enter a valid email address'),
});

export type EmailFormData = z.infer<typeof emailSchema>;

export const phoneSchema = z.object({
  phone: z.string().transform((val) => val.replace(/\D/g, '')),
});

export type PhoneFormData = z.infer<typeof phoneSchema>;

export const otpSchema = z.object({
  code: z.string().length(6, 'Enter the 6-digit code'),
});

export type OtpFormData = z.infer<typeof otpSchema>;
