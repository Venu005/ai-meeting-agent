'use client';

import PersonaPicker from '@/components/onboarding/PersonaPicker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/card';

const OnboardingPage = () => {
  return (
    <div className='from-background/50 to-muted/30 flex min-h-dvh items-center justify-center bg-linear-to-br p-4'>
      <Card className='w-full max-w-4xl shadow-sm'>
        <CardHeader className='space-y-2 text-center'>
          <CardTitle className='text-2xl font-semibold'>Choose your role</CardTitle>
          <CardDescription>
            We tailor meeting notes and structured documents to how you work. You can change this later in settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PersonaPicker />
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingPage;
