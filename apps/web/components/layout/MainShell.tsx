'use client';

import AppLogo from '@/components/layout/AppLogo';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@repo/ui/components/theme-toggle';
import { Button } from '@repo/ui/components/button';
import { cn } from '@repo/ui/lib/utils';
import { Calendar, CreditCard, LayoutDashboard, LogOut, Plus } from 'lucide-react';
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
    <div className='app-gradient-bg flex min-h-dvh'>
      {/* Desktop sidebar */}
      <aside className='bg-sidebar text-sidebar-foreground fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/10 md:flex'>
        <div className='flex h-16 items-center border-b border-white/10 px-5'>
          <AppLogo className='text-sidebar-foreground [&_span]:text-sidebar-foreground' />
        </div>

        <nav className='flex-1 space-y-1 px-3 py-4'>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
                )}
              >
                <Icon className='h-4 w-4 shrink-0' />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className='space-y-3 border-t border-white/10 p-4'>
          <div className='px-1'>
            <p className='truncate text-sm font-medium'>{user.name}</p>
            <p className='text-sidebar-foreground/60 truncate text-xs'>{user.email}</p>
          </div>
          <div className='flex items-center gap-2'>
            <ThemeToggle />
            <Button
              variant='ghost'
              size='sm'
              className='text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex-1 justify-start gap-2'
              onClick={() => nextAuthSignOut({ callbackUrl: '/login' })}
            >
              <LogOut className='h-4 w-4' />
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className='flex min-h-dvh flex-1 flex-col md:pl-64'>
        {/* Mobile header */}
        <header className='bg-background/80 sticky top-0 z-20 border-b backdrop-blur-md md:hidden'>
          <div className='flex items-center justify-between gap-3 px-4 py-3'>
            <AppLogo size='sm' />
            <div className='flex items-center gap-2'>
              <ThemeToggle />
              <Button variant='ghost' size='icon' onClick={() => nextAuthSignOut({ callbackUrl: '/login' })}>
                <LogOut className='h-4 w-4' />
              </Button>
            </div>
          </div>
          <nav className='flex gap-1 overflow-x-auto px-3 pb-3'>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  )}
                >
                  <Icon className='h-3.5 w-3.5' />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className='flex-1 px-4 py-6 md:px-8 md:py-8'>
          <div className='mx-auto max-w-5xl'>{children}</div>
        </main>
      </div>
    </div>
  );
};

export default MainShell;
