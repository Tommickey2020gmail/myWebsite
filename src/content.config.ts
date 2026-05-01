// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const baseFields = {
  title: z.string(),
  title_en: z.string().optional(),
  description: z.string().optional(),
  description_en: z.string().optional(),
  lang: z.enum(['zh', 'en']).default('zh'),
  tags: z.array(z.string()).default([]),
  created: z.coerce.date(),
  updated: z.coerce.date().optional(),
  draft: z.boolean().default(false),
  cover: z.string().optional(),
};

const garden = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/garden' }),
  schema: z.object({
    ...baseFields,
    status: z.enum(['seedling', 'budding', 'evergreen']).default('seedling'),
  }),
});

const essays = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/essays' }),
  schema: z.object({
    ...baseFields,
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    ...baseFields,
    repo: z.string().url().optional(),
    demo: z.string().url().optional(),
    stack: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
  }),
});

const books = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/books' }),
  schema: z.object({
    ...baseFields,
    author: z.string(),
    rating: z.number().min(1).max(5).optional(),
    finished: z.coerce.date().optional(),
  }),
});

const papers = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/papers' }),
  schema: z.object({
    ...baseFields,
    authors: z.array(z.string()).default([]),
    venue: z.string().optional(),
    // Accept full URL, DOI (e.g. "10.1038/nature12373"), or arXiv ID
    // (e.g. "arXiv:2301.00001"). Layouts decide how to render.
    link: z.string(),
    doi: z.string().optional(),
  }),
});

const now = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/now' }),
  schema: z.object({
    ...baseFields,
  }),
});

export const collections = { garden, essays, projects, books, papers, now };
