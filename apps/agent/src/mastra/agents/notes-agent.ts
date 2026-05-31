import { Agent } from '@mastra/core/agent';

export const notesAgent = new Agent({
  id: 'notes-agent',
  name: 'Meeting Notes Agent',
  instructions: `You extract structured meeting notes from transcripts.
Output Markdown with sections: Attendees, Topics Discussed, Decisions, Action Items.
Be factual; do not invent details not present in the transcript.`,
  model: 'openai/gpt-4.1',
});
