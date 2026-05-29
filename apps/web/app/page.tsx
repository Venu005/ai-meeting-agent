'use client';

import AppLogo from '@/components/layout/AppLogo';
import { Button } from '@repo/ui/components/button';
import { Bot, FileText, Sparkles, Video } from 'lucide-react';
import Link from 'next/link';

const FEATURES = [
  {
    icon: Video,
    title: 'Auto-joins Meet calls',
    description: 'Our AI bot joins your Google Meet at the scheduled time — no manual setup.',
  },
  {
    icon: FileText,
    title: 'Smart meeting notes',
    description: 'Get structured notes, key points, and role-tailored docs after every call.',
  },
  {
    icon: Sparkles,
    title: 'Calendar integration',
    description: 'Sync Google Calendar and enable the bot for upcoming Meet events instantly.',
  },
] as const;

const LandingPage = () => {
  return (
    <div className='app-gradient-bg min-h-dvh'>
      {/* Floating navbar */}
      <header className='fixed top-4 right-4 left-4 z-50 mx-auto flex max-w-6xl items-center justify-between rounded-xl border bg-background/80 px-4 py-3 shadow-sm backdrop-blur-md'>
        <AppLogo href='/' />
        <div className='flex items-center gap-2'>
          <Button variant='ghost' size='sm' asChild>
            <Link href='/login'>Sign in</Link>
          </Button>
          <Button size='sm' asChild className='bg-accent text-accent-foreground hover:bg-accent/90'>
            <Link href='/login'>Get started</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className='mx-auto max-w-6xl px-4 pt-32 pb-20 md:pt-40 md:pb-28'>
        <div className='mx-auto max-w-3xl text-center'>
          <div className='bg-primary/10 text-primary mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium'>
            <Bot className='h-4 w-4' />
            AI meeting assistant for Google Meet
          </div>
          <h1 className='text-4xl leading-tight font-bold tracking-tight md:text-5xl lg:text-6xl'>
            Your meetings, <span className='text-primary'>automatically documented</span>
          </h1>
          <p className='text-muted-foreground mx-auto mt-6 max-w-2xl text-lg'>
            Meetra joins your calls, captures every detail, and delivers structured notes tailored to your role — so you
            can focus on the conversation.
          </p>
          <div className='mt-8 flex flex-wrap items-center justify-center gap-3'>
            <Button size='lg' asChild className='bg-accent text-accent-foreground hover:bg-accent/90 h-12 px-8'>
              <Link href='/login'>Start for free</Link>
            </Button>
            <Button size='lg' variant='outline' asChild className='h-12 px-8'>
              <Link href='/login'>Sign in with Google</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className='mx-auto max-w-6xl px-4 pb-24'>
        <div className='grid gap-6 md:grid-cols-3'>
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className='bg-card hover:border-primary/30 rounded-xl border p-6 shadow-sm transition-colors duration-200'
              >
                <div className='bg-primary/10 text-primary mb-4 flex h-11 w-11 items-center justify-center rounded-lg'>
                  <Icon className='h-5 w-5' />
                </div>
                <h3 className='mb-2 text-lg font-semibold'>{feature.title}</h3>
                <p className='text-muted-foreground text-sm leading-relaxed'>{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className='mx-auto max-w-6xl px-4 pb-24'>
        <div className='bg-sidebar text-sidebar-foreground relative overflow-hidden rounded-2xl px-8 py-12 text-center md:px-16 md:py-16'>
          <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.627_0.104_181.5/0.25),transparent_70%)]' />
          <div className='relative space-y-4'>
            <h2 className='text-2xl font-bold tracking-tight md:text-3xl'>Ready to never miss a meeting detail?</h2>
            <p className='text-sidebar-foreground/70 mx-auto max-w-lg'>
              Connect your Google account and schedule your first meeting in under a minute.
            </p>
            <Button size='lg' asChild className='bg-accent text-accent-foreground hover:bg-accent/90 mt-4'>
              <Link href='/login'>Get started free</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className='border-t py-8 text-center'>
        <p className='text-muted-foreground text-sm'>© {new Date().getFullYear()} Meetra. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
