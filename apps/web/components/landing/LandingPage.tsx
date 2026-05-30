'use client';

import About from '@/components/landing/About';
import Features from '@/components/landing/Features';
import Hero from '@/components/landing/Hero';

const LandingPage = () => {
  return (
    <div className='bg-black text-cream'>
      <Hero />
      <About />
      <Features />

      <footer className='border-t border-white/10 px-4 py-8 text-center'>
        <p className='text-gray-500 text-sm'>© {new Date().getFullYear()} Meetra. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
