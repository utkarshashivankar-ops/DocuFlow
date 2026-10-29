const { z } = require('zod');
const { CATEGORIES } = require('../models/Document');

const email = z.string().trim().toLowerCase().email('Please enter a valid email address.').max(120);
const password = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(72, 'Password must be at most 72 characters.')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter.')
  .regex(/\d/, 'Password must contain at least one number.');

const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Please enter your full name.').max(80),
    email,
    password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match.', path: ['confirmPassword'] });

const loginSchema = z.object({ email, password: z.string().min(1, 'Password is required.') });
const forgotSchema = z.object({ email });
const resetSchema = z
  .object({
    email,
    code: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code from your email.'),
    password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match.', path: ['confirmPassword'] });

const optText = (max) => z.string().trim().max(max).optional();
const dateField = z.union([z.string().trim(), z.null()]).optional();

const uploadBodySchema = z.object({
  title: optText(160),
  category: z.enum(CATEGORIES).optional(),
});

const createDocumentSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(160),
  documentType: optText(80),
  category: z.enum(CATEGORIES).default('Other'),
  holderName: optText(120),
  documentNumber: optText(60),
  issueDate: dateField,
  expiryDate: dateField,
});

const updateDocumentSchema = z.object({
  title: z.string().trim().min(1, 'Title cannot be empty.').max(160).optional(),
  documentType: z.string().trim().min(1).max(80).optional(),
  category: z.enum(CATEGORIES).optional(),
  holderName: z.string().trim().max(120).nullable().optional(),
  documentNumber: z.string().trim().max(60).nullable().optional(),
  issueDate: dateField,
  expiryDate: dateField,
});

const listQuerySchema = z.object({
  category: z.string().optional(),
  status: z.enum(['active', 'expiring', 'expired']).optional(),
  sort: z.enum(['newest', 'oldest', 'expiry']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const searchQuerySchema = z.object({ q: z.string().trim().min(1, 'Type something to search.').max(100) });

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  pushToken: z.string().trim().max(200).nullable().optional(),
  preferences: z
    .object({
      inAppNotifications: z.boolean().optional(),
      emailNotifications: z.boolean().optional(),
      pushNotifications: z.boolean().optional(),
      expiryWarningDays: z.number().int().min(1).max(365).optional(),
      reminderDays: z.array(z.number().int().min(1).max(365)).min(1).max(6).optional(),
    })
    .optional(),
});

const renewalUpdateSchema = z.object({
  status: z.enum(['Not Started', 'In Progress', 'Completed']).optional(),
  notes: z.string().trim().max(1000).optional(),
  officialUrl: z.union([z.literal(''), z.string().trim().max(300).url('Enter a valid web address (https://…).')
    .refine((u) => /^https?:\/\//i.test(u), 'The address must start with http:// or https://')]).optional(),
  checklist: z.array(z.object({ label: z.string().trim().min(1).max(120), done: z.boolean() })).max(20).optional(),
});

const shareCreateSchema = z.object({
  expiresInHours: z.number().int().min(1, 'Minimum is 1 hour.').max(168, 'Maximum is 7 days (168 hours).').default(24),
});

const notificationListSchema = z.object({
  unread: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const ocrProcessSchema = z.object({ documentId: z.string().min(1) });

module.exports = {
  registerSchema, loginSchema, forgotSchema, resetSchema, uploadBodySchema, createDocumentSchema,
  updateDocumentSchema, listQuerySchema, searchQuerySchema, profileSchema, ocrProcessSchema,
  renewalUpdateSchema, shareCreateSchema, notificationListSchema,
};
