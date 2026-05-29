import { ApiClient } from '@/lib/api-client';
import { ChatType } from '@repo/shared-types/types';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface GetChatsResponse {
  chats: ChatType[];
  pagination: PaginationMeta;
}

export interface GetChatsQueryDto extends Record<string, unknown> {
  page?: number;
  limit?: number;
}

export class ChatService {
  static async createTranscript(file: File) {
    const formData = new FormData();
    formData.append('voice', file);
    return await ApiClient.post<string>(`/api/agents/transcript`, formData);
  }
  static async createChat() {
    return await ApiClient.post<ChatType>('/api/agents/chat');
  }

  static async getChatById(chatId: string) {
    return await ApiClient.get<ChatType>(`/api/agents/chat/${chatId}`);
  }

  static async getChatWithMessages(chatId: string) {
    return await ApiClient.get<ChatType>(`/api/agents/chat/${chatId}/messages`);
  }

  static async getChats(query?: GetChatsQueryDto) {
    return await ApiClient.get<GetChatsResponse>(`/api/agents/chats`, query);
  }

  static async deleteChat(chatId: string) {
    return await ApiClient.delete(`/api/agents/chat/${chatId}`);
  }

  static async updateChat(chatId: string, body: { title?: string; isPublic?: boolean }) {
    return await ApiClient.put(`/api/agents/chat/${chatId}`, body);
  }

  static async getPublicChatsForUser() {
    return await ApiClient.get<ChatType[]>(`/api/agents/chats/public`);
  }
}
