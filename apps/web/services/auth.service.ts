import { ApiClient } from '@/lib/api-client';
import { envConfig } from '@/config';
import { AuthContextType } from '@repo/shared-types/types';
import axios, { isAxiosError } from 'axios';

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string;
  };
}

export interface GoogleAuthPayload {
  idToken: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
}

export class AuthService {
  static async handleGoogleAuth(payload: GoogleAuthPayload) {
    try {
      const response = await axios.post<LoginResponse>(`${envConfig.apiUrl}/api/auth/google`, payload);
      return response.data;
    } catch (error) {
      if (isAxiosError(error)) {
        const message = error.response?.data?.message ?? error.message;
        throw new Error(Array.isArray(message) ? message.join(', ') : message);
      }

      throw error;
    }
  }

  static async me() {
    return await ApiClient.get<AuthContextType>('/api/auth/me');
  }
}
