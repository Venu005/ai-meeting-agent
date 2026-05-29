import { ApiClient } from '@/lib/api-client';
import { CreateMeetingInput, Meeting } from '@repo/shared-types/schemas';

export interface MeetingsPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedMeetings {
  meetings: Meeting[];
  pagination: MeetingsPagination;
}

export class MeetingService {
  static async list(params?: { page?: number; limit?: number }) {
    return ApiClient.get<PaginatedMeetings>('/api/meetings', params);
  }

  static async get(id: string) {
    return ApiClient.get<Meeting>(`/api/meetings/${id}`);
  }

  static async create(input: CreateMeetingInput) {
    return ApiClient.post<Meeting>('/api/meetings', input);
  }

  static async cancel(id: string) {
    return ApiClient.patch<Meeting>(`/api/meetings/${id}/cancel`);
  }
}
