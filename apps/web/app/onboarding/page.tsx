'use client';

import PersonaPicker from '@/components/onboarding/PersonaPicker';
import AppLogo from '@/components/layout/AppLogo';
import { Bot } from 'lucide-react';

const OnboardingPage = () => {
  return (
    <div className='app-gradient-bg flex min-h-dvh flex-col items-center justify-center px-4 py-12'>
      <div className='mb-8'>
        <AppLogo />
      </div>

      <div className='bg-card w-full max-w-4xl rounded-2xl border p-8 shadow-sm md:p-10'>
        <div className='mb-8 space-y-3 text-center'>
          <div className='bg-primary/10 text-primary mx-auto flex h-12 w-12 items-center justify-center rounded-xl'>
            <Bot className='h-6 w-6' />
          </div>
          <h1 className='text-2xl font-semibold tracking-tight md:text-3xl'>Choose your role</h1>
          <p className='text-muted-foreground mx-auto max-w-lg text-sm md:text-base'>
            We tailor meeting notes and structured documents to how you work. You can change this later in settings.
          </p>
        </div>
        <PersonaPicker />
      </div>
    </div>
  );
};

export default OnboardingPage;
