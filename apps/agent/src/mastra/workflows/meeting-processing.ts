import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { engLeadAgent } from '../agents/eng-lead-agent';
import { founderAgent } from '../agents/founder-agent';
import { notesAgent } from '../agents/notes-agent';
import { pmAgent } from '../agents/pm-agent';

const workflowInputSchema = z.object({
  transcript: z.string().min(1),
  userRole: z.enum(['SOLO_FOUNDER', 'PRODUCT_MANAGER', 'ENGINEERING_LEAD']),
  meetingTitle: z.string(),
  attendees: z.array(z.string()).optional(),
  durationMinutes: z.number().optional(),
});

const normalizeStep = createStep({
  id: 'normalize-transcript',
  inputSchema: workflowInputSchema,
  outputSchema: z.object({ transcript: z.string(), userRole: z.string(), meetingTitle: z.string() }),
  execute: async ({ inputData }) => ({
    transcript: inputData.transcript.trim(),
    userRole: inputData.userRole,
    meetingTitle: inputData.meetingTitle,
  }),
});

const keyPointsStep = createStep({
  id: 'extract-key-points',
  inputSchema: z.object({ transcript: z.string(), userRole: z.string(), meetingTitle: z.string() }),
  outputSchema: z.object({
    keyPoints: z.array(z.string()),
    transcript: z.string(),
    userRole: z.string(),
    meetingTitle: z.string(),
  }),
  execute: async ({ inputData }) => {
    const result = await notesAgent.generate(
      `Extract 5-10 key takeaways from this meeting titled "${inputData.meetingTitle}".
Return a JSON array of strings only.
Each string MUST use the format: **Topic label:** one-sentence takeaway
Do not wrap in markdown code fences.

Transcript:
${inputData.transcript}`
    );
    const parsed = JSON.parse(result.text.replace(/```json|```/g, '').trim()) as string[];
    return { ...inputData, keyPoints: parsed };
  },
});

const notesStep = createStep({
  id: 'generate-meeting-notes',
  inputSchema: z.object({
    keyPoints: z.array(z.string()),
    transcript: z.string(),
    userRole: z.string(),
    meetingTitle: z.string(),
  }),
  outputSchema: z.object({
    notes: z.string(),
    keyPoints: z.array(z.string()),
    transcript: z.string(),
    userRole: z.string(),
    meetingTitle: z.string(),
  }),
  execute: async ({ inputData }) => {
    const result = await notesAgent.generate(
      `Generate meeting notes for "${inputData.meetingTitle}" using EXACTLY these sections:
## Topics Discussed
## Questions & Answers
## Next Steps & Action Items

Do not include Key Takeaways (already extracted separately).
Do not include Attendees or a separate Decisions section.

Transcript:
${inputData.transcript}`
    );
    return { ...inputData, notes: result.text };
  },
});

const docStep = createStep({
  id: 'generate-structured-doc',
  inputSchema: z.object({
    notes: z.string(),
    keyPoints: z.array(z.string()),
    transcript: z.string(),
    userRole: z.string(),
    meetingTitle: z.string(),
  }),
  outputSchema: z.object({
    notes: z.string(),
    structuredDoc: z.string(),
    keyPoints: z.array(z.string()),
  }),
  execute: async ({ inputData }) => {
    const agentMap = {
      SOLO_FOUNDER: founderAgent,
      PRODUCT_MANAGER: pmAgent,
      ENGINEERING_LEAD: engLeadAgent,
    } as const;
    const agent = agentMap[inputData.userRole as keyof typeof agentMap];
    const result = await agent.generate(
      `Using these meeting notes, produce the structured document for "${inputData.meetingTitle}".\n\n${inputData.notes}`
    );
    return { notes: inputData.notes, structuredDoc: result.text, keyPoints: inputData.keyPoints };
  },
});

export const meetingProcessingWorkflow = createWorkflow({
  id: 'meeting-processing',
  inputSchema: workflowInputSchema,
  outputSchema: z.object({
    notes: z.string(),
    structuredDoc: z.string(),
    keyPoints: z.array(z.string()),
  }),
})
  .then(normalizeStep)
  .then(keyPointsStep)
  .then(notesStep)
  .then(docStep)
  .commit();
