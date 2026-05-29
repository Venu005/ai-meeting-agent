import { RequestHint } from '@repo/shared-types/types';

export const getToolsPrompt = () => {
  return `\n\n### Tools You Can Use 
  | Tool             | Purpose                                               |
  | ---------------- | ----------------------------------------------------- |
  | \`searchMemories\` | Find previously stored details and context            |
  | \`addMemory\`      | Store new relevant information for future sessions    |
  | \`web_search\`     | Find real-world data, facts, or current information   |
  `;
};

export const getMemoryProtocolPrompt = () => {
  return `\n\n### Memory protocol (IMPORTANT)
  - Before proceeding with user's request, check if relevant details are already known, if we have anything missing, search through memory to find it.
  - If found, confirm softly and proceed with the request.
  - If not found, ask naturally for missing context.
  - After getting the missing context, store it in memory using the \`addMemory\` tool.
  - After storing the missing context, proceed with the request.
  - Always use the \`searchMemories\` tool to search through memory before proceeding with the request.
  `;
};

export const getTemporalContextPrompt = (requestHints?: RequestHint) => {
  const currentUtc = new Date().toISOString();
  let prompt = `\n\n### Temporal Context
  The current real-world date and time (UTC) is: ${currentUtc}.
  Always use this value for any time or date-related reasoning or calculations.
  Ignore any internal or prior knowledge about the current year or date from your training data.
  When interpreting user input related to "current time", treat "${currentUtc}" as now.
  `;

  if (requestHints) {
    const { city, state, country, timezone, latitude, longitude } = requestHints;
    prompt += `\n\n## User's Current Location Information
City: ${city || 'unknown'}
State/Province: ${state || 'unknown'}
Country: ${country || 'unknown'}
Timezone: ${timezone || 'unknown'}
Latitude: ${latitude || 'unknown'}
Longitude: ${longitude || 'unknown'}

IMPORTANT: Only use this information when you need to reference the user's current location details in any context.`;
  }

  return prompt;
};
