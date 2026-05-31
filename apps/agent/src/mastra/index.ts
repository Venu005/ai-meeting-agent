import { Mastra } from '@mastra/core/mastra';
import { engLeadAgent } from './agents/eng-lead-agent';
import { founderAgent } from './agents/founder-agent';
import { notesAgent } from './agents/notes-agent';
import { pmAgent } from './agents/pm-agent';
import { meetingProcessingWorkflow } from './workflows/meeting-processing';

export const mastra = new Mastra({
  agents: { notesAgent, founderAgent, pmAgent, engLeadAgent },
  workflows: { meetingProcessingWorkflow },
});
