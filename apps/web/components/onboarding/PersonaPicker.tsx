'use client';

import LoadingButton from '@/components/general/LoadingButton';
import { useCompleteOnboarding } from '@/queries/user';
import { UserPersonaEnum } from '@repo/shared-types/enums';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/card';
import { cn } from '@repo/ui/lib/utils';
import { Briefcase, Code2, Rocket } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const PERSONAS = [
  {
    value: UserPersonaEnum.SOLO_FOUNDER,
    title: 'Solo Founder',
    description: 'Lightweight specs, key decisions, and action items from your meetings.',
    icon: Rocket,
  },
  {
    value: UserPersonaEnum.PRODUCT_MANAGER,
    title: 'Product Manager',
    description: 'Full PRDs with requirements, metrics, and open questions.',
    icon: Briefcase,
  },
  {
    value: UserPersonaEnum.ENGINEERING_LEAD,
    title: 'Engineering Lead',
    description: 'Technical RFCs with architecture decisions and blockers.',
    icon: Code2,
  },
] as const;

const PersonaPicker = () => {
  const [selected, setSelected] = useState<UserPersonaEnum | null>(null);
  const router = useRouter();
  const { mutate: completeOnboarding, isPending } = useCompleteOnboarding();

  const handleContinue = () => {
    if (!selected) {
      return;
    }

    completeOnboarding(selected, {
      onSuccess: () => {
        router.replace('/dashboard');
      },
    });
  };

  return (
    <div className='space-y-6'>
      <div className='grid gap-4 md:grid-cols-3'>
        {PERSONAS.map((persona) => {
          const Icon = persona.icon;
          const isSelected = selected === persona.value;

          return (
            <button key={persona.value} type='button' onClick={() => setSelected(persona.value)} className='text-left'>
              <Card
                className={cn(
                  'h-full cursor-pointer transition-colors hover:border-primary/50',
                  isSelected && 'border-primary ring-primary/20 ring-2',
                )}
              >
                <CardHeader className='space-y-3'>
                  <div className='bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg'>
                    <Icon className='h-5 w-5' />
                  </div>
                  <CardTitle className='text-lg'>{persona.title}</CardTitle>
                  <CardDescription>{persona.description}</CardDescription>
                </CardHeader>
                <CardContent />
              </Card>
            </button>
          );
        })}
      </div>

      <LoadingButton className='w-full sm:w-auto' disabled={!selected} isLoading={isPending} onClick={handleContinue}>
        Continue to dashboard
      </LoadingButton>
    </div>
  );
};

export default PersonaPicker;
