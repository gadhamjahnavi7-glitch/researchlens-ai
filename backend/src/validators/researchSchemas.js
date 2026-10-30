import { z } from 'zod';

export const chatMessageSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  conversationId: z.string().optional().nullable(),
  question: z.string().trim().min(2, 'Question must be at least 2 characters').max(3000, 'Question too long'),
  documentIds: z.array(z.string()).optional().default([])
});

export const reportGenerateSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  title: z.string().trim().min(3, 'Report title is required').max(300).optional(),
  researchQuestion: z.string().trim().min(5, 'Research question must be at least 5 characters').max(1000),
  documentIds: z.array(z.string()).optional().default([])
});

export const claimCompareSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  topic: z.string().trim().optional().default(''),
  documentIds: z.array(z.string()).optional().default([])
});

export const discoveryAnalyzeSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  documentIds: z.array(z.string()).optional().default([])
});

