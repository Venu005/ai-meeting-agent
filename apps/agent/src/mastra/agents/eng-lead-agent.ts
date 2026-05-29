import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Agent } from '@mastra/core/agent';

const __dirname = dirname(fileURLToPath(import.meta.url));
const instructions = readFileSync(join(__dirname, '../prompts/eng-rfc.md'), 'utf-8');

export const engLeadAgent = new Agent({
  id: 'eng-lead-agent',
  name: 'Engineering Lead RFC Agent',
  instructions,
  model: 'openai/gpt-4.1',
});
