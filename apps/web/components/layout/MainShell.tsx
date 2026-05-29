'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@repo/ui/components/theme-toggle';
import { Button } from '@repo/ui/components/button';
import { cn } from '@repo/ui/lib/utils';
import { Calendar, CreditCard, LayoutDashboard, Plus } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut as nextAuthSignOut } from 'next-auth/react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/meetings/new', label: 'Schedule', icon: Plus },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/settings/billing', label: 'Billing', icon: CreditCard },
] as const;

const MainShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const user = useAuth();

  return (
    <div className='bg-background min-h-dvh'>
      <header className='border-b'>
        <div className='mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3'>
          <Link href='/dashboard' className='text-lg font-semibold tracking-tight'>
            AI Meeting Agent
          </Link>
          <nav className='hidden items-center gap-1 md:flex'>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Button key={item.href} variant={isActive ? 'secondary' : 'ghost'} size='sm' asChild>
                  <Link href={item.href} className={cn('gap-2')}>
                    <Icon className='h-4 w-4' />
                    {item.label}
                  </Link>
                </Button>
              );
            })}
          </nav>
          <div className='flex items-center gap-2'>
            <span className='text-muted-foreground hidden text-sm sm:inline'>{user.name}</span>
            <ThemeToggle />
            <Button variant='outline' size='sm' onClick={() => nextAuthSignOut({ callbackUrl: '/login' })}>
              Sign out
            </Button>
          </div>
        </div>
        <nav className='flex gap-1 overflow-x-auto border-t px-4 py-2 md:hidden'>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Button key={item.href} variant={isActive ? 'secondary' : 'ghost'} size='sm' asChild>
                <Link href={item.href} className='gap-2 whitespace-nowrap'>
                  <Icon className='h-4 w-4' />
                  {item.label}
                </Link>
              </Button>
            );
          })}
        </nav>
      </header>
      <main className='mx-auto max-w-6xl px-4 py-6'>{children}</main>
    </div>
  );
};

export default MainShell;
