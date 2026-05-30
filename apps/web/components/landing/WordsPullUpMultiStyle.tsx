'use client';

import { motion, useInView } from 'framer-motion';
import { useMemo, useRef } from 'react';

interface TextSegment {
  text: string;
  className?: string;
}

interface WordsPullUpMultiStyleProps {
  segments: TextSegment[];
  className?: string;
}

const WordsPullUpMultiStyle = ({ segments, className }: WordsPullUpMultiStyleProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  const words = useMemo(
    () =>
      segments.flatMap((segment) =>
        segment.text.split(' ').map((word) => ({
          word,
          className: segment.className,
        })),
      ),
    [segments],
  );

  return (
    <div ref={ref} className={`inline-flex flex-wrap justify-center ${className ?? ''}`}>
      {words.map(({ word, className: wordClassName }, index) => (
        <motion.span
          key={`${word}-${index}`}
          className={`mr-[0.25em] inline-block ${wordClassName ?? ''}`}
          initial={{ y: 20, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : undefined}
          transition={{ delay: index * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
};

export default WordsPullUpMultiStyle;
