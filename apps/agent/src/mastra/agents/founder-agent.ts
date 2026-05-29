import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Agent } from '@mastra/core/agent';

const __dirname = dirname(fileURLToPath(import.meta.url));
const instructions = readFileSync(join(__dirname, '../prompts/founder-prd.md'), 'utf-8');

export const founderAgent = new Agent({
  id: 'founder-agent',
  name: 'Founder Spec Agent',
  instructions,
  model: 'openai/gpt-4.1',
});
