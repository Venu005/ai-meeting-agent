import { Injectable, Logger } from '@nestjs/common';
import { config } from 'src/common/config';

export type MeetingProcessingInput = {
  transcript: string;
  userRole: 'SOLO_FOUNDER' | 'PRODUCT_MANAGER' | 'ENGINEERING_LEAD';
  meetingTitle: string;
  attendees?: string[];
  durationMinutes?: number;
};

export type MeetingProcessingResult = {
  notes: string;
  structuredDoc: string;
  keyPoints: string[];
};

type MastraWorkflowResponse = {
  status?: string;
  result?: MeetingProcessingResult;
  data?: MeetingProcessingResult;
  error?: { message?: string };
};

@Injectable()
export class MastraClient {
  private readonly logger = new Logger(MastraClient.name);

  async processMeeting(input: MeetingProcessingInput): Promise<MeetingProcessingResult> {
    const res = await fetch(`${config.mastra.url}/api/workflows/meetingProcessingWorkflow/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputData: input }),
    });

    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`Mastra workflow failed: ${res.status} ${body}`);
      throw new Error(`Mastra error: ${res.status}`);
    }

    const data = (await res.json()) as MastraWorkflowResponse;

    if (data.status && data.status !== 'success') {
      throw new Error(data.error?.message ?? 'Workflow failed');
    }

    const result = data.result ?? data.data;
    if (!result) {
      throw new Error('Workflow returned no result');
    }

    return result;
  }
}
