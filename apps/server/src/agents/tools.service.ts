import { Injectable } from '@nestjs/common';
import { tool, generateText, Tool } from 'ai';
import { z } from 'zod';
import { google } from '@ai-sdk/google';
import { fallbackPrompts } from './prompts';

@Injectable()
export class ToolsService {
  constructor() {}
  websiteSearchTool(): Tool {
    return tool({
      description:
        'Use this tool to search the web, you must use this tool when you needed live information, or needed any information from internet',
      inputSchema: z.object({
        query: z.string().describe('Be specific about what you want to search'),
      }),
      execute: async ({ query }) => {
        try {
          const { text } = await generateText({
            model: google('gemini-2.0-flash'),
            prompt: query,
            system: fallbackPrompts.getWebSearchPrompt(),
          });
          return {
            success: true,
            data: text,
          };
        } catch (error) {
          console.error('error', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
    });
  }

  getTools() {
    return {
      web_search: this.websiteSearchTool(),
    };
  }
}
