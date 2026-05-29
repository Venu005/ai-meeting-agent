import { readFileSync } from 'fs';

export const fallbackPrompts = {
  getChatAgentPrompt: () => {
    const chatAgentPrompt = readFileSync(`src/agents/prompts/chat-agent.md`, 'utf8');
    return chatAgentPrompt;
  },
  getWebSearchPrompt: () => {
    const webSearchPrompt = readFileSync(`src/agents/prompts/web-search.md`, 'utf8');
    return webSearchPrompt;
  },
};
