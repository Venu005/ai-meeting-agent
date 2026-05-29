import { Agent } from '@mastra/core/agent';
import { loadPrompt } from '../prompts/load-prompt';

const instructions = loadPrompt('pm-prd.md');

export const pmAgent = new Agent({
  id: 'pm-agent',
  name: 'PM PRD Agent',
  instructions,
  model: 'openai/gpt-4.1',
});
