import React from 'react';

interface EmptyMessageProps {
  message: string;
  description?: string;
  cta?: React.ReactNode;
  icon?: React.ReactNode;
}

const EmptyMessage = ({ message = 'No Data Found', description, icon, cta }: EmptyMessageProps) => {
  return (
    <div className='bg-card/50 flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 px-6 py-12 text-center'>
      {icon}
      <p className='mt-2 text-base font-semibold'>{message}</p>
      {description && (
        <p className={`text-muted-foreground mt-1 max-w-sm text-sm ${cta ? 'mb-4' : ''}`}>{description}</p>
      )}
      {cta}
    </div>
  );
};

export default EmptyMessage;
