'use client';

import LoadingButton from '@/components/general/LoadingButton';
import { useCompleteOnboarding } from '@/queries/user';
import { UserPersonaEnum } from '@repo/shared-types/enums';
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
    <div className='space-y-8'>
      <div className='grid gap-4 md:grid-cols-3'>
        {PERSONAS.map((persona) => {
          const Icon = persona.icon;
          const isSelected = selected === persona.value;

          return (
            <button
              key={persona.value}
              type='button'
              onClick={() => setSelected(persona.value)}
              className='cursor-pointer text-left'
            >
              <div
                className={cn(
                  'bg-card/60 h-full rounded-2xl border border-white/10 p-5 backdrop-blur-sm transition-all duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-black/20',
                  isSelected && 'border-primary ring-primary/20 bg-primary/[0.04] ring-2',
                )}
              >
                <div className='space-y-4'>
                  <div className='bg-primary/10 text-primary flex h-11 w-11 items-center justify-center rounded-xl'>
                    <Icon className='h-5 w-5' />
                  </div>
                  <div className='space-y-2'>
                    <h3 className='text-lg font-semibold tracking-tight'>{persona.title}</h3>
                    <p className='text-muted-foreground text-sm leading-relaxed'>{persona.description}</p>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <LoadingButton
        className='w-full shadow-lg shadow-black/20 sm:w-auto'
        disabled={!selected}
        isLoading={isPending}
        onClick={handleContinue}
      >
        Continue to dashboard
      </LoadingButton>
    </div>
  );
};

export default PersonaPicker;
