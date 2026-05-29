'use client';

import AppLogo from '@/components/layout/AppLogo';
import { Button } from '@repo/ui/components/button';
import { ArrowLeft, Home, SearchX } from 'lucide-react';
import Link from 'next/link';

const NotFoundPage = () => {
  return (
    <div className='app-gradient-bg flex min-h-dvh items-center justify-center p-4'>
      <div className='bg-card w-full max-w-md rounded-2xl border p-8 text-center shadow-sm'>
        <div className='bg-primary/10 text-primary mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl'>
          <SearchX className='h-7 w-7' />
        </div>
        <h1 className='mb-2 text-2xl font-semibold tracking-tight'>Page not found</h1>
        <p className='text-muted-foreground mb-8 text-sm'>
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>
        <div className='flex flex-col gap-3'>
          <Button asChild className='w-full'>
            <Link href='/dashboard'>
              <Home className='mr-2 h-4 w-4' />
              Go to dashboard
            </Link>
          </Button>
          <Button variant='outline' className='w-full' onClick={() => window.history.back()}>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Go back
          </Button>
        </div>
        <div className='mt-8 flex justify-center'>
          <AppLogo size='sm' />
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
