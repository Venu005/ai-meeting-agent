import { ApiClient } from '@/lib/api-client';
import { AuthContextType } from '@repo/shared-types/types';

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string;
  };
}

export class AuthService {
  static async handleGoogleAuth(idToken: string) {
    return await ApiClient.post<LoginResponse>('/api/auth/google', { idToken });
  }

  static async me() {
    return await ApiClient.get<AuthContextType>('/api/auth/me');
  }
}
