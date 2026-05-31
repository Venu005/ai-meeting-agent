'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { RefObject } from 'react';

interface AnimatedLetterProps {
  char: string;
  index: number;
  totalChars: number;
  containerRef: RefObject<HTMLElement | null>;
}

const AnimatedLetter = ({ char, index, totalChars, containerRef }: AnimatedLetterProps) => {
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.8', 'end 0.2'],
  });

  const charProgress = index / totalChars;
  const opacity = useTransform(scrollYProgress, [charProgress - 0.1, charProgress + 0.05], [0.2, 1]);

  return (
    <motion.span style={{ opacity }} className='inline-block'>
      {char === ' ' ? '\u00A0' : char}
    </motion.span>
  );
};

export default AnimatedLetter;
