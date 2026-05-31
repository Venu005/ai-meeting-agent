import { Agent } from '@mastra/core/agent';
import { loadPrompt } from '../prompts/load-prompt';

const instructions = loadPrompt('eng-rfc.md');

export const engLeadAgent = new Agent({
  id: 'eng-lead-agent',
  name: 'Engineering Lead RFC Agent',
  instructions,
  model: 'openai/gpt-4.1',
});
