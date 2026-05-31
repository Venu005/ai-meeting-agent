'use client';

import AppLogo from '@/components/layout/AppLogo';
import { Button } from '@repo/ui/components/button';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const ErrorPage = ({ error, reset }: ErrorProps) => {
  return (
    <div className='app-shell flex min-h-dvh items-center justify-center p-4'>
      <div className='bg-card w-full max-w-md rounded-2xl border p-8'>
        <div className='mb-4 flex flex-col items-center text-center'>
          <div className='bg-destructive/10 text-destructive mb-4 flex h-14 w-14 items-center justify-center rounded-xl'>
            <AlertTriangle className='h-7 w-7' />
          </div>
          <h1 className='text-2xl font-semibold tracking-tight'>Something went wrong</h1>
          <p className='text-muted-foreground mt-1 text-sm'>An unexpected error occurred.</p>
        </div>

        <div className='bg-muted/50 mb-6 rounded-lg p-4'>
          <p className='text-muted-foreground text-sm break-words'>{error.message || 'An unknown error occurred'}</p>
          {error.digest && <p className='text-muted-foreground mt-2 text-xs'>Error ID: {error.digest}</p>}
        </div>

        <div className='flex flex-col gap-3'>
          <Button className='w-full' onClick={() => reset()}>
            <RefreshCw className='mr-2 h-4 w-4' />
            Try again
          </Button>
          <Button variant='outline' className='w-full' asChild>
            <Link href='/dashboard'>
              <Home className='mr-2 h-4 w-4' />
              Go to dashboard
            </Link>
          </Button>
        </div>

        <div className='mt-8 flex justify-center'>
          <AppLogo size='sm' />
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
