import { Bot } from 'lucide-react';
import React from 'react';

const GlobalLoading = () => {
  return (
    <div className='app-gradient-bg absolute top-0 left-0 z-50 flex h-dvh w-full items-center justify-center'>
      <div className='flex flex-col items-center gap-4'>
        <div className='bg-primary/10 text-primary flex h-16 w-16 items-center justify-center rounded-2xl'>
          <Bot className='h-8 w-8 animate-pulse' />
        </div>
        <p className='text-muted-foreground text-sm font-medium'>Loading…</p>
      </div>
    </div>
  );
};

export default GlobalLoading;
