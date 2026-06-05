import React from 'react';
import { cn } from '@repo/ui/lib/utils';

interface EmptyMessageProps {
  message: string;
  description?: string;
  cta?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

const EmptyMessage = ({ message = 'No Data Found', description, icon, cta, className }: EmptyMessageProps) => {
  return (
    <div
      className={cn(
        'bg-card/40 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 px-6 py-14 text-center backdrop-blur-sm',
        className,
      )}
    >
      {icon}
      <p className='mt-2 text-base font-semibold tracking-tight'>{message}</p>
      {description && (
        <p className={`text-muted-foreground mt-2 max-w-sm text-sm leading-relaxed ${cta ? 'mb-5' : ''}`}>
          {description}
        </p>
      )}
      {cta}
    </div>
  );
};

export default EmptyMessage;
