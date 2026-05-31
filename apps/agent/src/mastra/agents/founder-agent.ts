import { Agent } from '@mastra/core/agent';
import { loadPrompt } from '../prompts/load-prompt';

const instructions = loadPrompt('founder-prd.md');

export const founderAgent = new Agent({
  id: 'founder-agent',
  name: 'Founder Spec Agent',
  instructions,
  model: 'openai/gpt-4.1',
});
