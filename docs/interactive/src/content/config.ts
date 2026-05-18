import { contentSchema } from '@tutorialkit/types';
import { defineCollection, z } from 'astro:content';

const schema = z.preprocess((val) => {
  if (val && typeof val === 'object' && 'llm' in val) {
    const { llm, ...rest } = val as Record<string, unknown>;
    return rest;
  }
  return val;
}, contentSchema);

const tutorial = defineCollection({
  type: 'content',
  schema,
});

export const collections = { tutorial };
