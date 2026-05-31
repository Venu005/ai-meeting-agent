import { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { envConfig } from '@/config';
import { AuthService } from '@/services';

const GOOGLE_CALENDAR_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events.readonly',
].join(' ');

const googleAuthProvider = GoogleProvider({
  clientId: envConfig.providers.google.clientId,
  clientSecret: envConfig.providers.google.clientSecret,
  authorization: {
    params: {
      prompt: 'consent',
      access_type: 'offline',
      scope: GOOGLE_CALENDAR_SCOPES,
    },
  },
});

export const authOptions: AuthOptions = {
  providers: [googleAuthProvider],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== 'google') {
        return true;
      }

      const email = profile?.email ?? user.email;
      if (!email || !account.id_token) {
        console.error('Google sign-in missing email or id_token');
        return false;
      }

      try {
        const resp = await AuthService.handleGoogleAuth({
          idToken: account.id_token,
          ...(account.access_token ? { accessToken: account.access_token } : {}),
          ...(account.refresh_token ? { refreshToken: account.refresh_token } : {}),
          ...(account.expires_at ? { expiresAt: new Date(account.expires_at * 1000).toISOString() } : {}),
        });
        if (resp) {
          user.id = resp.user.id;
          user.name = resp.user.name ?? 'Unknown';
          user.email = resp.user.email;
          user.avatarUrl = resp.user.avatarUrl || user.image || '';
          user.token = resp.token;
          return true;
        }

        console.error('Google sign-in API returned empty response');
        return false;
      } catch (error) {
        console.error('Error signing in:', error);
        return false;
      }
    },
    async jwt({ token, user, trigger, session }) {
      if (trigger === 'update' && session?.user) {
        return { ...token, ...session.user };
      }
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.avatarUrl = user.avatarUrl || '';
        token.token = user.token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.avatarUrl = token.avatarUrl as string;
        session.user.token = token.token as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
};
