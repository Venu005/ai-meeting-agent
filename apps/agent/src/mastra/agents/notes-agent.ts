import { Agent } from '@mastra/core/agent';

export const notesAgent = new Agent({
  id: 'notes-agent',
  name: 'Meeting Notes Agent',
  instructions: `You extract structured meeting notes from transcripts.

Output Markdown with EXACTLY these ## sections (in order):
1. ## Topics Discussed
2. ## Questions & Answers
3. ## Next Steps & Action Items

Do NOT include Key Takeaways, Attendees, or a separate Decisions section.

## Topics Discussed
Use ### sub-headings for sub-topics. Use bullets with **Label:** detail and *Completed:* / *In Progress:* where relevant.

## Questions & Answers
Use **Q1:**, **Q2:**, etc. Put each answer in a blockquote (> ...).

## Next Steps & Action Items
Use a numbered list. Append *(Owner: Name)* and *(Deadline: date)* in italics when known.

Be factual. Do not invent details not present in the transcript.`,
  model: 'openai/gpt-4.1',
});
