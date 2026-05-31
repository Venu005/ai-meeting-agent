import { Bot } from 'lucide-react';

interface DataLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
}

export const DataLoader = ({ message, className, ...props }: DataLoaderProps) => {
  return (
    <div className={`flex h-[40vh] flex-col items-center justify-center gap-4 ${className || ''}`} {...props}>
      <div className='bg-primary/10 text-primary flex h-14 w-14 items-center justify-center rounded-xl'>
        <Bot className='h-7 w-7 animate-pulse' />
      </div>
      {message && <p className='text-muted-foreground text-sm'>{message}</p>}
    </div>
  );
};
