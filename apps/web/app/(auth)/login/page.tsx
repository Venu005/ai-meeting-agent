'use client';

import AppLogo from '@/components/layout/AppLogo';
import { Alert, AlertDescription } from '@repo/ui/components/alert';
import { Button } from '@repo/ui/components/button';
import { Bot, FileText, Sparkles, Video } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const FEATURES = [
  {
    icon: Video,
    title: 'Auto-joins Meet calls',
    description: 'Send our AI bot to any Google Meet link at the scheduled time.',
  },
  {
    icon: FileText,
    title: 'Structured notes',
    description: 'Get meeting notes, key points, and role-tailored documents when the call ends.',
  },
  {
    icon: Sparkles,
    title: 'Calendar sync',
    description: 'Connect Google Calendar and enable the bot for upcoming Meet events in one click.',
  },
] as const;

const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  AccessDenied:
    'Google sign-in was blocked. Approve all requested permissions (including Calendar), and ensure your email is added as a test user in Google Cloud Console while the app is in Testing mode.',
  OAuthSignin:
    'Could not start Google sign-in. Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in apps/web/.env.local.',
  OAuthCallback:
    'Google sign-in callback failed. Confirm the redirect URI http://localhost:3000/api/auth/callback/google is configured in Google Cloud.',
  Configuration: 'Auth is misconfigured. Check NEXTAUTH_SECRET, NEXTAUTH_URL, and Google OAuth credentials.',
  Default: 'Sign-in failed. Make sure the API server is running on port 3001 and try again.',
};

const LoginErrorAlert = () => {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get('error');

  if (!errorCode) {
    return null;
  }

  const message = LOGIN_ERROR_MESSAGES[errorCode] ?? LOGIN_ERROR_MESSAGES.Default;

  return (
    <Alert variant='destructive'>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
};

const LoginPageContent = () => {
  return (
    <div className='app-shell flex min-h-dvh w-full'>
      <div className='relative hidden w-full flex-col justify-between overflow-hidden rounded-r-3xl bg-sidebar p-10 text-sidebar-foreground lg:flex lg:w-1/2'>
        <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(222,219,200,0.14),transparent_60%)]' />
        <div className='bg-noise pointer-events-none absolute inset-0 opacity-[0.15]' />
        <div className='relative z-10'>
          <AppLogo className='text-sidebar-foreground [&_span]:text-sidebar-foreground' size='md' href='/' />
        </div>

        <div className='relative z-10 space-y-10'>
          <div className='space-y-4'>
            <div className='bg-sidebar-accent inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs font-medium'>
              <Bot className='h-3.5 w-3.5' />
              AI-powered meeting assistant
            </div>
            <h1 className='font-serif-accent text-4xl leading-tight tracking-tight md:text-5xl'>
              Never miss a detail from your meetings again
            </h1>
            <p className='text-sidebar-foreground/70 max-w-md text-lg leading-relaxed'>
              Meetra joins your Google Meet calls, listens in, and delivers structured notes tailored to how you work.
            </p>
          </div>

          <ul className='space-y-5'>
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <li key={feature.title} className='flex gap-4'>
                  <div className='bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl'>
                    <Icon className='h-4 w-4' />
                  </div>
                  <div>
                    <p className='text-sm font-medium'>{feature.title}</p>
                    <p className='text-sidebar-foreground/60 text-sm leading-relaxed'>{feature.description}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <p className='text-sidebar-foreground/50 relative z-10 text-xs'>© {new Date().getFullYear()} Meetra</p>
      </div>

      <div className='relative z-10 flex w-full flex-1 flex-col items-center justify-center bg-background px-6 py-12 lg:w-1/2 lg:px-16 xl:px-24'>
        <div className='w-full max-w-md space-y-8'>
          <div className='bg-card/80 space-y-8 rounded-2xl border border-white/10 p-8 backdrop-blur-sm lg:border-0 lg:bg-transparent lg:p-0'>
            <div className='space-y-2 text-center lg:text-left'>
              <div className='mb-6 flex justify-center lg:hidden'>
                <AppLogo href='/' />
              </div>
              <p className='app-section-label hidden lg:block'>Sign in</p>
              <h2 className='font-serif-accent text-3xl tracking-tight'>Get started</h2>
              <p className='text-muted-foreground text-sm leading-relaxed'>
                Sign up or sign in with Google to schedule meetings and view AI-generated notes.
              </p>
            </div>

            <LoginErrorAlert />

            <Button
              size='lg'
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
              className='h-12 w-full shadow-lg shadow-black/20'
            >
              <svg className='mr-2 h-5 w-5' viewBox='0 0 24 24' aria-hidden='true'>
                <path
                  fill='currentColor'
                  d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                />
                <path
                  fill='currentColor'
                  d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                />
                <path
                  fill='currentColor'
                  d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                />
                <path
                  fill='currentColor'
                  d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                />
              </svg>
              Continue with Google
            </Button>

            <p className='text-muted-foreground text-center text-xs lg:text-left'>
              By continuing, you agree to our terms of service and privacy policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
