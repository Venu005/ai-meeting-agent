'use client';

import AnimatedLetter from '@/components/landing/AnimatedLetter';
import WordsPullUpMultiStyle from '@/components/landing/WordsPullUpMultiStyle';
import { useRef } from 'react';

const ABOUT_BODY =
  'Over the last year, we have helped product leaders, founders, and remote teams reclaim hours each week. From standups to board reviews, Meetra listens in, transcribes accurately, and synthesizes what matters — so nothing falls through the cracks.';

const About = () => {
  const containerRef = useRef<HTMLElement>(null);
  const chars = ABOUT_BODY.split('');

  return (
    <section id='about' ref={containerRef} className='bg-black px-4 py-20 md:px-6 md:py-28'>
      <div className='mx-auto max-w-6xl rounded-2xl bg-[#101010] px-6 py-16 text-center md:px-12 md:py-20'>
        <p className='mb-8 text-[10px] sm:text-xs' style={{ color: '#DEDBC8' }}>
          AI meeting assistant
        </p>

        <WordsPullUpMultiStyle
          className='mx-auto mb-10 max-w-3xl text-3xl leading-[0.95] sm:text-4xl sm:leading-[0.9] md:text-5xl lg:text-6xl xl:text-7xl'
          segments={[
            { text: 'Meetra is your AI meeting partner,', className: 'font-normal text-cream' },
            { text: 'built for teams who live in Google Meet.', className: 'font-serif-accent text-cream' },
            {
              text: 'We turn every conversation into structured notes, key points, and role-aware docs.',
              className: 'font-normal text-cream',
            },
          ]}
        />

        <p className='mx-auto max-w-2xl text-xs leading-relaxed sm:text-sm md:text-base' style={{ color: '#DEDBC8' }}>
          {chars.map((char, index) => (
            <AnimatedLetter
              key={`${char}-${index}`}
              char={char}
              index={index}
              totalChars={chars.length}
              containerRef={containerRef}
            />
          ))}
        </p>
      </div>
    </section>
  );
};

export default About;
