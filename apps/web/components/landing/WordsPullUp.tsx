'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface WordsPullUpProps {
  text: string;
  className?: string;
  showAsterisk?: boolean;
}

const WordsPullUp = ({ text, className, showAsterisk }: WordsPullUpProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const words = text.split(' ');

  return (
    <span ref={ref} className={className}>
      {words.map((word, index) => {
        const isLast = index === words.length - 1;

        return (
          <motion.span
            key={`${word}-${index}`}
            className='relative mr-[0.25em] inline-block'
            initial={{ y: 20, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : undefined}
            transition={{ delay: index * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {showAsterisk && isLast && word.endsWith('a') ? (
              <>
                {word.slice(0, -1)}
                <span className='relative inline-block'>
                  a<span className='absolute top-[0.65em] -right-[0.3em] text-[0.31em]'>*</span>
                </span>
              </>
            ) : (
              word
            )}
          </motion.span>
        );
      })}
    </span>
  );
};

export default WordsPullUp;
