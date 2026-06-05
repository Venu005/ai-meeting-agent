'use client';

import PersonaPicker from '@/components/onboarding/PersonaPicker';
import AppLogo from '@/components/layout/AppLogo';
import AppPanel from '@/components/layout/AppPanel';
import { Bot } from 'lucide-react';

const OnboardingPage = () => {
  return (
    <div className='app-shell flex min-h-dvh flex-col items-center justify-center px-4 py-12'>
      <div className='mb-10'>
        <AppLogo />
      </div>

      <AppPanel glow className='w-full max-w-4xl p-8 md:p-10'>
        <div className='mb-10 space-y-4 text-center'>
          <div className='bg-primary/10 text-primary mx-auto flex h-14 w-14 items-center justify-center rounded-2xl'>
            <Bot className='h-7 w-7' />
          </div>
          <p className='app-section-label'>Onboarding</p>
          <h1 className='font-serif-accent text-3xl tracking-tight md:text-4xl'>Choose your role</h1>
          <p className='text-muted-foreground mx-auto max-w-lg text-sm leading-relaxed md:text-base'>
            We tailor meeting notes and structured documents to how you work. You can change this later in settings.
          </p>
        </div>
        <PersonaPicker />
      </AppPanel>
    </div>
  );
};

export default OnboardingPage;
