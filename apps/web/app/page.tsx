'use client';

import { Button } from '@repo/ui/components/button';
import { ThemeToggle } from '@repo/ui/components/theme-toggle';
import { Loader2 } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

const Page = () => {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='animate-spin' />
        <p className='ml-3 text-sm font-medium'>Loading...</p>
      </div>
    );
  }
  if (status === 'unauthenticated') {
    return (
      <div className='flex h-screen flex-col items-center justify-center gap-4'>
        <p className='font-medium'>Unauthenticated</p>
        <Link href='/login'>
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className='p-4'>
      <div className='bg-card mx-auto max-w-md rounded-lg p-6 shadow-sm'>
        <h2 className='mb-4 text-2xl font-bold'>Authentication Status</h2>

        <div className='space-y-4'>
          <div>
            {session?.user && (
              <pre className='bg-muted mt-2 space-y-2 overflow-x-auto rounded-md p-4 whitespace-break-spaces'>
                {JSON.stringify(session.user, null, 2)}
              </pre>
            )}
          </div>

          <div className='flex items-center gap-2'>
            <Button onClick={() => signOut()} variant='destructive'>
              Sign Out
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
