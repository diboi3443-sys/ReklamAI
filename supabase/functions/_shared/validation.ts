// Zod validation schemas for Edge Functions
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

export const uploadSchema = z.object({
  purpose: z.enum(['startFrame', 'endFrame', 'referenceImage', 'referenceVideo']),
  generationId: z.string().uuid().optional(),
});

export const generateSchema = z.object({
  boardId: z.string().uuid().optional().nullable(),
  presetKey: z.string(),
  modelKey: z.string(),
  prompt: z.string().min(1),
  input: z.object({
    startFramePath: z.string().optional(),
    endFramePath: z.string().optional(),
    referenceImagePath: z.string().optional(),
    referenceVideoPath: z.string().optional(),
    params: z.record(z.any()).optional(),
  }).optional(),
});

export const statusSchema = z.object({
  generationId: z.string().uuid(),
});

export const downloadSchema = z.object({
  generationId: z.string().uuid(),
});
