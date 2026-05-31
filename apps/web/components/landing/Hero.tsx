'use client';

import WordsPullUp from '@/components/landing/WordsPullUp';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

const NAV_ITEMS = [
  { label: 'How it works', href: '#about' },
  { label: 'Features', href: '#features' },
  { label: 'Calendar', href: '/login' },
  { label: 'Pricing', href: '/login' },
  { label: 'Sign in', href: '/login' },
] as const;

const HERO_VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4';

const Hero = () => {
  return (
    <section className='h-screen p-4 md:p-6'>
      <div className='relative h-full overflow-hidden rounded-2xl md:rounded-[2rem]'>
        <video
          autoPlay
          loop
          muted
          playsInline
          className='absolute inset-0 h-full w-full object-cover'
          src={HERO_VIDEO_URL}
        />

        <div className='noise-overlay pointer-events-none absolute inset-0 opacity-[0.7] mix-blend-overlay' />
        <div className='absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60' />

        <nav className='absolute top-0 left-1/2 z-20 -translate-x-1/2'>
          <ul className='flex items-center gap-3 rounded-b-2xl bg-black px-4 py-2 sm:gap-6 md:gap-12 md:rounded-b-3xl md:px-8 lg:gap-14'>
            {NAV_ITEMS.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className='text-[10px] transition-colors duration-200 hover:text-[#E1E0CC] sm:text-xs md:text-sm'
                  style={{ color: 'rgba(225, 224, 204, 0.8)' }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className='absolute right-0 bottom-0 left-0 z-10 p-6 md:p-10 lg:p-12'>
          <div className='grid grid-cols-12 items-end gap-6'>
            <div className='col-span-12 lg:col-span-8'>
              <h1
                className='text-[26vw] leading-[0.85] font-medium tracking-[-0.07em] sm:text-[24vw] md:text-[22vw] lg:text-[20vw] xl:text-[19vw] 2xl:text-[20vw]'
                style={{ color: '#E1E0CC' }}
              >
                <WordsPullUp text='Meetra' showAsterisk />
              </h1>
            </div>

            <div className='col-span-12 flex flex-col gap-5 lg:col-span-4'>
              <motion.p
                className='text-xs leading-[1.2] sm:text-sm md:text-base'
                style={{ color: 'rgba(222, 219, 200, 0.7)' }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                Meetra joins your Google Meet calls, captures every detail, and delivers structured notes tailored to
                your role — so you can focus on the conversation.
              </motion.p>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  href='/login'
                  className='group inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200 hover:gap-3 sm:text-base'
                  style={{ backgroundColor: '#DEDBC8', color: '#000000' }}
                >
                  Get started free
                  <span className='flex h-9 w-9 items-center justify-center rounded-full bg-black transition-transform duration-200 group-hover:scale-110 sm:h-10 sm:w-10'>
                    <ArrowRight className='h-4 w-4' style={{ color: '#DEDBC8' }} />
                  </span>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
