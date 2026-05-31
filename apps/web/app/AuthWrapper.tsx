'use client';

import { verifyToken } from '@/helpers/validation.helpers';
import { useCurrentUser } from '@/queries/user';
import { signOut, useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

const ONBOARDING_PATH = '/onboarding';
const PUBLIC_AUTHENTICATED_PATHS = [ONBOARDING_PATH];

const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = status === 'authenticated';
  const { data: user, isLoading: isUserLoading } = useCurrentUser(isAuthenticated);

  useEffect(() => {
    if (session?.user.token) {
      verifyToken(session.user.token).then((payload) => {
        if (!payload) {
          signOut({
            callbackUrl: '/login',
          });
        }
      });
    }
  }, [session?.user.token]);

  useEffect(() => {
    if (!isAuthenticated || isUserLoading || !user) {
      return;
    }

    const isOnboardingRoute = pathname === ONBOARDING_PATH;

    if (!user.onboardingCompleted && !PUBLIC_AUTHENTICATED_PATHS.includes(pathname)) {
      router.replace(ONBOARDING_PATH);
      return;
    }

    if (user.onboardingCompleted && isOnboardingRoute) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isUserLoading, user, pathname, router]);

  if (isAuthenticated && isUserLoading && !PUBLIC_AUTHENTICATED_PATHS.includes(pathname)) {
    return null;
  }

  return <>{children}</>;
};

export default AuthWrapper;
