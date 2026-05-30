'use client';

import WordsPullUpMultiStyle from '@/components/landing/WordsPullUpMultiStyle';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';

const FEATURES_VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260406_133058_0504132a-0cf3-4450-a370-8ea3b05c95d4.mp4';

const CARD_ICONS = {
  notes:
    'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_171918_4a5edc79-d78f-4637-ac8b-53c43c220606.png&w=1280&q=85',
  transcript:
    'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_171741_ed9845ab-f5b2-4018-8ce7-07cc01823522.png&w=1280&q=85',
  calendar:
    'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260405_171809_f56666dc-c099-4778-ad82-9ad4f209567b.png&w=1280&q=85',
} as const;

interface FeatureCardProps {
  index: number;
  children: React.ReactNode;
}

const FeatureCard = ({ index, children }: FeatureCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      className='relative flex min-h-[320px] flex-col overflow-hidden rounded-xl bg-[#212121] p-5 sm:min-h-[360px] lg:min-h-0 lg:h-full'
      initial={{ scale: 0.95, opacity: 0 }}
      animate={isInView ? { scale: 1, opacity: 1 } : undefined}
      transition={{ delay: index * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

interface ChecklistItemProps {
  text: string;
}

const ChecklistItem = ({ text }: ChecklistItemProps) => (
  <li className='flex items-start gap-2 text-xs sm:text-sm'>
    <Check className='mt-0.5 h-4 w-4 shrink-0' style={{ color: '#DEDBC8' }} />
    <span className='text-gray-400'>{text}</span>
  </li>
);

interface InfoCardProps {
  index: number;
  number: string;
  title: string;
  iconUrl: string;
  items: string[];
}

const InfoCard = ({ index, number, title, iconUrl, items }: InfoCardProps) => (
  <FeatureCard index={index}>
    <Image
      src={iconUrl}
      alt=''
      width={48}
      height={48}
      className='mb-4 h-10 w-10 rounded object-cover sm:h-12 sm:w-12'
    />
    <div className='mb-4'>
      <span className='text-gray-500 text-xs'>{number}</span>
      <h3 className='mt-1 text-lg font-normal sm:text-xl' style={{ color: '#E1E0CC' }}>
        {title}
      </h3>
    </div>
    <ul className='flex flex-1 flex-col gap-2'>
      {items.map((item) => (
        <ChecklistItem key={item} text={item} />
      ))}
    </ul>
    <Link
      href='/login'
      className='mt-6 inline-flex items-center gap-1 text-xs transition-opacity hover:opacity-80 sm:text-sm'
      style={{ color: '#DEDBC8' }}
    >
      Learn more
      <ArrowRight className='h-4 w-4 -rotate-45' />
    </Link>
  </FeatureCard>
);

const Features = () => {
  return (
    <section id='features' className='relative min-h-screen bg-black px-4 py-20 md:px-6 md:py-28'>
      <div className='bg-noise pointer-events-none absolute inset-0 opacity-[0.15]' />

      <div className='relative mx-auto max-w-6xl'>
        <WordsPullUpMultiStyle
          className='mb-12 max-w-3xl text-xl sm:text-2xl md:text-3xl lg:text-4xl'
          segments={[
            { text: 'Meeting intelligence for modern teams.', className: 'font-normal text-cream-primary' },
            { text: 'Built for focus. Powered by AI.', className: 'font-normal text-gray-500' },
          ]}
        />

        <div className='grid grid-cols-1 gap-3 sm:gap-2 md:grid-cols-2 md:gap-1 lg:h-[480px] lg:grid-cols-4'>
          <FeatureCard index={0}>
            <div className='absolute inset-0'>
              <video autoPlay loop muted playsInline className='h-full w-full object-cover' src={FEATURES_VIDEO_URL} />
              <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent' />
            </div>
            <p className='relative mt-auto text-base font-normal sm:text-lg' style={{ color: '#E1E0CC' }}>
              Every call, captured.
            </p>
          </FeatureCard>

          <InfoCard
            index={1}
            number='01'
            title='Structured Notes.'
            iconUrl={CARD_ICONS.notes}
            items={[
              'Role-tailored summaries after every meeting',
              'Key points and action items extracted automatically',
              'Structured docs ready to share with your team',
              'Processing completes within minutes of call end',
            ]}
          />

          <InfoCard
            index={2}
            number='02'
            title='Live Transcripts.'
            iconUrl={CARD_ICONS.transcript}
            items={[
              'Full transcript with speaker-aware formatting',
              'Recording playback synced to your meeting',
              'Searchable history for every completed call',
            ]}
          />

          <InfoCard
            index={3}
            number='03'
            title='Calendar Sync.'
            iconUrl={CARD_ICONS.calendar}
            items={[
              'Google Calendar integration out of the box',
              'One-click bot enable for upcoming Meet events',
              'Automatic join at scheduled meeting time',
            ]}
          />
        </div>
      </div>
    </section>
  );
};

export default Features;
