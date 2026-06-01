import { envConfig } from '@/config';
import { ApiClient } from '@/lib/api-client';

export interface MeetingChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export class MeetingChatService {
  static async getChat(meetingId: string) {
    return ApiClient.get<MeetingChatMessage[]>(`/api/meetings/${meetingId}/chat`);
  }

  static async clearChat(meetingId: string) {
    return ApiClient.delete<{ message: string }>(`/api/meetings/${meetingId}/chat`);
  }

  static chatApiUrl(meetingId: string) {
    return `${envConfig.apiUrl}/api/meetings/${meetingId}/chat`;
  }
}
