import { z } from 'zod';

export const createProjectSchema = z.object({
  title: z.string().trim().min(2, 'Project title must be at least 2 characters').max(200, 'Title cannot exceed 200 characters'),
  description: z.string().trim().max(2000, 'Description cannot exceed 2000 characters').optional().default(''),
  tags: z.array(z.string().trim()).optional().default([])
});

export const updateProjectSchema = z.object({
  title: z.string().trim().min(2).max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  tags: z.array(z.string().trim()).optional()
});

