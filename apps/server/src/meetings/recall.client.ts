import { Injectable, Logger } from '@nestjs/common';
import { config } from 'src/common/config';

type RecallBotResponse = {
  id: string;
  recordings?: Array<{
    id: string;
    started_at?: string;
    completed_at?: string;
    media_shortcuts?: {
      transcript?: {
        id: string;
        data?: {
          download_url?: string;
        };
      };
    };
  }>;
};

type RecallTranscriptUtterance = {
  speaker?: string;
  words?: Array<{ text?: string }>;
};

@Injectable()
export class RecallClient {
  private readonly logger = new Logger(RecallClient.name);

  async createBot(params: { meetingUrl: string; joinAt: string; botName?: string }): Promise<{ id: string }> {
    const res = await fetch(`${config.recall.baseUrl}/bot`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${config.recall.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        meeting_url: params.meetingUrl,
        join_at: params.joinAt,
        bot_name: params.botName ?? 'AI Meeting Agent',
        transcription_options: { provider: 'default' },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`Recall createBot failed: ${res.status} ${body}`);
      throw new Error(`Recall API error: ${res.status}`);
    }

    return res.json() as Promise<{ id: string }>;
  }

  async getBot(botId: string): Promise<RecallBotResponse> {
    const res = await fetch(`${config.recall.baseUrl}/bot/${botId}`, {
      headers: {
        Authorization: `Token ${config.recall.apiKey}`,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`Recall getBot failed: ${res.status} ${body}`);
      throw new Error(`Recall API error: ${res.status}`);
    }

    return res.json() as Promise<RecallBotResponse>;
  }

  async getBotTranscript(botId: string): Promise<{ transcript: string; durationMinutes: number }> {
    const bot = await this.getBot(botId);
    const recording = bot.recordings?.[0];
    const downloadUrl = recording?.media_shortcuts?.transcript?.data?.download_url;

    if (!downloadUrl) {
      throw new Error(`No transcript available for bot ${botId}`);
    }

    const transcriptRes = await fetch(downloadUrl);
    if (!transcriptRes.ok) {
      throw new Error(`Failed to download transcript: ${transcriptRes.status}`);
    }

    const utterances = (await transcriptRes.json()) as RecallTranscriptUtterance[];
    const transcript = utterances
      .map((utterance) => {
        const text = utterance.words
          ?.map((word) => word.text ?? '')
          .join(' ')
          .trim();
        if (!text) {
          return null;
        }
        return utterance.speaker ? `${utterance.speaker}: ${text}` : text;
      })
      .filter(Boolean)
      .join('\n');

    const durationMinutes = this.estimateDurationMinutes(recording?.started_at, recording?.completed_at);

    return { transcript, durationMinutes };
  }

  private estimateDurationMinutes(startedAt?: string, completedAt?: string): number {
    if (startedAt && completedAt) {
      const start = new Date(startedAt).getTime();
      const end = new Date(completedAt).getTime();
      if (end > start) {
        return Math.max(1, Math.ceil((end - start) / 60_000));
      }
    }

    return 1;
  }
}
