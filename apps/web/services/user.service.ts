import { ApiClient } from '@/lib/api-client';
import { UserPersonaEnum } from '@repo/shared-types/enums';
import { UserProfile } from '@repo/shared-types/types';

export class UserService {
  static async me() {
    return ApiClient.get<UserProfile>('/api/users/me');
  }

  static async completeOnboarding(persona: UserPersonaEnum) {
    return ApiClient.post<UserProfile>('/api/users/onboarding', { persona });
  }
}
